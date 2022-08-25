// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project
    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.
    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

import * as React from 'react';
import { Keyboard } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';

// Components
import { Container, Content, Spacing } from 'components/layout/Layout';
import Icon from 'components/core/Icon';
import Spinner from 'components/Spinner';
import Banner from 'components/Banner/Banner';
import Button from 'components/legacy/Button';
import SendHighGasModal from 'components/HighGasFeeModals/SendHighGasModal';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Text from 'components/core/Text';
import FeeLabelToggle from 'components/FeeLabelToggle';

// Constants
import { CHAIN } from 'constants/chainConstants';
import { NI_TRANSACTION_COMPLETED } from 'constants/navigationConstants';

// Utils
import { useChainConfig } from 'utils/uiConfig';
import { nativeAssetPerChain } from 'utils/chains';
import { addressesEqual } from 'utils/assets';
import { getActiveScreenName } from 'utils/navigation';
import { isHighGasFee } from 'utils/transactions';

// Types
import type { AssetOption } from 'models/Asset';
import type { Chain } from 'models/Chain';

// Selectors
import { useChainRates, useFiatCurrency, useRootSelector } from 'selectors';
import { gasThresholdsSelector } from 'redux/selectors/gas-threshold-selector';

// Local
import FromAssetSelector from './FromAssetSelector';
import ToAssetSelector from './ToAssetSelector';
import {
  useFromAssets,
  useToAssetsCrossChain,
  useCrossChainBuildTransactionQuery,
  useToAssetValueQuery,
} from './utils';

// services
import etherspotService from 'services/etherspot';
import { catchError } from 'services/nativeIntegration';

// Actions
import { resetEstimateTransactionAction } from 'actions/transactionEstimateActions';

// Hooks
import { useTransactionsEstimate, useTransactionFeeCheck } from 'hooks/transactions';

interface Props {
  fetchCrossChainTitle: (val: string) => void;
}

function CrossChain({ fetchCrossChainTitle }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const fromInputRef: any = React.useRef();
  const screenName = getActiveScreenName(navigation);
  const fiatCurrency = useFiatCurrency();
  const gasThresholds = useRootSelector(gasThresholdsSelector);
  const isOnline = useRootSelector((root) => root.session.data.isOnline);
  const initialChain: Chain = navigation.getParam('chain');
  const initialFromAddress: string =
    navigation.getParam('fromAssetAddress') || nativeAssetPerChain[initialChain]?.address;

  const [chain, setChain] = React.useState(initialChain);
  const [toAddressChain, setToAddressChain] = React.useState(null);
  const [fromAddress, setFromAddress] = React.useState(initialFromAddress);
  const [toAddress, setToAddress] = React.useState(null);
  const [fromValue, setFromValue] = React.useState(null);
  const [toValue, setToValue] = React.useState(null);

  const fromOptions = useFromAssets();
  const toOptions = useToAssetsCrossChain(chain);
  const chainConfig = useChainConfig(chain);
  const toChainConfig = useChainConfig(toAddressChain || CHAIN.ETHEREUM);
  const chainRates = useChainRates(chain);

  React.useEffect(() => {
    dispatch(resetEstimateTransactionAction());
  }, []);

  const fromAsset = React.useMemo(
    () => fromOptions.find((a) => a.chain === chain && addressesEqual(a.address, fromAddress)),
    [fromOptions, fromAddress, chain],
  );

  const toAsset = React.useMemo(
    () => toOptions?.find((a) => a.chain === toAddressChain && addressesEqual(a.address, toAddress)),
    [toOptions, toAddress, chain],
  );

  const customCrosschainTitle = !fromAsset
    ? t('exchangeContent.title.crossChain')
    : chainConfig.titleShort + ' → ' + (toAddressChain ? toChainConfig.titleShort : '');

  React.useEffect(() => {
    fetchCrossChainTitle && fetchCrossChainTitle(customCrosschainTitle);
  }, [chain, customCrosschainTitle, fetchCrossChainTitle, fromAddress, toAddress]);

  const buildTractionQuery = useCrossChainBuildTransactionQuery(fromAsset, toAsset, fromValue);
  const buildTransactionData = buildTractionQuery.data;
  const buildTransactionFetched = buildTractionQuery.isFetched;
  const toAssetValueQuery = useToAssetValueQuery(fromAsset, toAsset, fromValue);
  const toAssetValue = toAssetValueQuery.data;

  const txData = React.useMemo(() => {
    if (!buildTransactionData) return null;
    const { approvalTransactionData, transactionData } = buildTransactionData;
    if (!approvalTransactionData) return [transactionData];
    return [approvalTransactionData, transactionData];
  }, [buildTransactionData]);

  const { feeInfo, errorMessage: estimationErrorMessage, isEstimating } = useTransactionsEstimate(chain, txData);
  const transactionFee = useTransactionFeeCheck(chain || CHAIN.ETHEREUM, feeInfo, fromAsset, fromValue);

  React.useEffect(() => {
    toAssetValue && setToValue(toAssetValue);
  }, [toAssetValue]);

  const handleSelectFromAsset = (asset: AssetOption) => {
    setChain(asset.chain);
    setFromAddress(asset.address);
    setToValue(null);
    if (chain !== asset.chain) {
      setToAddress(null);
      setToAddressChain(null);
    }
  };

  const handleSelectToAsset = (asset: AssetOption) => {
    setToAddress(asset.address);
    setToAddressChain(asset.chain);
    setToValue(null);
  };

  async function onSubmit() {
    const res = await etherspotService
      .setTransactionsBatchAndSend(txData, chain)
      .catch(() => catchError('Transaction Failed!', null));
    if (res) navigation.navigate(NI_TRANSACTION_COMPLETED, { transactionInfo: { chain: chain, ...res } });
  }

  const showLoading = buildTractionQuery.isLoading;
  const highFee = isHighGasFee(chain, feeInfo?.fee, feeInfo?.gasToken, chainRates, fiatCurrency, gasThresholds);

  const highGasFeeModal = highFee ? (
    <SendHighGasModal value={fromValue} contact={fromAddress} chain={chain} txFeeInfo={feeInfo} />
  ) : null;

  const errorMessage = estimationErrorMessage | transactionFee?.errorMessage;

  console.log('transactionFee', !isOnline, !feeInfo, !!errorMessage, isEstimating);

  return (
    <Container>
      <Content bounces={false} onScroll={() => Keyboard.dismiss()}>
        <Banner screenName={screenName} bottomPosition={false} />
        <FromAssetSelector
          title={t('assetSelector.choose_token_crosschain')}
          assets={fromOptions}
          selectedAsset={fromAsset}
          onSelectAsset={handleSelectFromAsset}
          value={fromValue}
          onValueChange={setFromValue}
          editable={!!fromAsset}
          valueInputRef={fromInputRef}
        />

        <IconWrapper>{toAsset ? <Icon name="arrow-down" /> : <Spacing h={24} />}</IconWrapper>

        <ToAssetSelector
          title={t('assetSelector.choose_token_crosschain')}
          assets={toOptions}
          selectedAsset={toAsset}
          onSelectAsset={handleSelectToAsset}
          value={toValue}
        />

        <Spacing h={40} />

        {(isEstimating || showLoading) && (
          <EmptyStateWrapper>
            <Spinner />
          </EmptyStateWrapper>
        )}

        {feeInfo?.fee && (
          <FooterContent>
            <FeeLabelToggle
              txFeeInWei={feeInfo.fee}
              gasToken={feeInfo.gasToken}
              chain={chain}
              isLoading={isEstimating}
              hasError={!transactionFee?.isEnoughForFee}
              highGasFeeModal={highGasFeeModal}
            />
            <Spacing h={20} />
            <Button
              disabled={!isOnline || !feeInfo || !!errorMessage || isEstimating}
              title={t('button.swap')}
              onPress={onSubmit}
            />
          </FooterContent>
        )}
        {!buildTransactionData && buildTransactionFetched && (
          <EmptyStateWrapper>
            <EmptyStateParagraph
              title={t('exchangeContent.emptyState.routes.title')}
              bodyText={t('exchangeContent.emptyState.routes.paragraph')}
              large
            />
          </EmptyStateWrapper>
        )}
      </Content>
    </Container>
  );
}

export default CrossChain;

const IconWrapper = styled.View`
  margin: 8px 0 8px;
  align-self: center;
`;

const EmptyStateWrapper = styled.View`
  justify-content: center;
  align-items: center;
  margin-top: 40px;
`;

const FooterContent = styled.View`
  align-items: center;
`;
