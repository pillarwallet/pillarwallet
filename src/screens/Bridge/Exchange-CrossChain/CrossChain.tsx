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
import BigNumber from 'bignumber.js';

// Components
import { Container, Content, Spacing } from 'components/layout/Layout';
import Icon from 'components/core/Icon';
import Spinner from 'components/Spinner';
import Banner from 'components/Banner/Banner';
import SwipeButton from 'components/SwipeButton/SwipeButton';
import SendHighGasModal from 'components/HighGasFeeModals/SendHighGasModal';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Text from 'components/core/Text';

// Constants
import { CHAIN } from 'constants/chainConstants';
import { NI_TRANSACTION_COMPLETED } from 'constants/navigationConstants';

// Utils
import { useChainConfig } from 'utils/uiConfig';
import { nativeAssetPerChain } from 'utils/chains';
import { addressesEqual } from 'utils/assets';
import { getActiveScreenName } from 'utils/navigation';
import { getCurrencySymbol } from 'utils/common';
import { getTxFeeInFiat } from 'utils/transactions';
import { isHighGasFee } from 'utils/transactions';
import { logBreadcrumb } from 'utils/common';

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
import { fontSizes } from 'utils/variables';

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
  const currencySymbol = getCurrencySymbol(fiatCurrency);
  const gasThresholds = useRootSelector(gasThresholdsSelector);
  const initialChain: Chain = navigation.getParam('chain') || CHAIN.ETHEREUM;
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

  React.useEffect(() => {
    supportedTokenList();
  }, []);
  const supportedTokenList = async () => {
    const data = await etherspotService.getCrossChainBridgeTokenList();
    logBreadcrumb('getCrossChainBridgeTokenList data!', 'list of all supported token list', { data });
  };

  const fromAsset = React.useMemo(
    () => fromOptions.find((a) => a.chain === chain && addressesEqual(a.address, fromAddress)),
    [fromOptions, fromAddress, chain],
  );

  const toAsset = React.useMemo(
    () => toOptions.find((a) => a.chain !== chain && addressesEqual(a.address, toAddress)),
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
    const hexValue = new BigNumber(transactionData.value);
    return [
      { ...approvalTransactionData, value: 0 },
      { data: transactionData.data, to: transactionData.to, value: hexValue.toString() },
    ];
  }, [buildTransactionData]);

  const { feeInfo, errorMessage: estimationErrorMessage, isEstimating } = useTransactionsEstimate(chain, txData);
  const { errorMessage: notEnoughForFeeErrorMessage } = useTransactionFeeCheck(chain, feeInfo, fromAsset, fromValue);

  React.useEffect(() => {
    toAssetValue && setToValue(toAssetValue);
  }, [toAssetValue]);

  // Focus on from amount input after user changes fromAsset
  React.useEffect(() => {
    let isCancelled = false;

    setTimeout(() => {
      if (!isCancelled) fromInputRef.current?.focus();
    }, 650);

    return () => {
      isCancelled = true;
    };
  }, [dispatch, fromAsset]);

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
    const { value, data, to } = buildTransactionData;
    const hexValue = new BigNumber(value);
    const res = await etherspotService
      .setTransactionsBatchAndSend([{ to, value: hexValue.toString(), data }], chain)
      .catch(() => catchError('Transaction Failed!', null));
    if (res) navigation.navigate(NI_TRANSACTION_COMPLETED, { transactionInfo: { chain: chain, ...res } });
  }

  const showLoading = buildTractionQuery.isLoading;
  const highFee = isHighGasFee(chain, feeInfo?.fee, feeInfo?.gasToken, chainRates, fiatCurrency, gasThresholds);

  const highGasFeeModal = highFee ? (
    <SendHighGasModal value={fromValue} contact={fromAddress} chain={chain} txFeeInfo={feeInfo} />
  ) : null;

  const feeInFiat = getTxFeeInFiat(chain, feeInfo?.fee, feeInfo?.gasToken, chainRates, fiatCurrency);
  const feeInFiatDisplayValue = `${currencySymbol}${feeInFiat.toFixed(5)}`;

  const errorMessage = estimationErrorMessage | notEnoughForFeeErrorMessage;

  return (
    <Container>
      <Content onScroll={() => Keyboard.dismiss()}>
        <Banner screenName={screenName} bottomPosition={false} />
        <FromAssetSelector
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
          assets={toOptions}
          selectedAsset={toAsset}
          onSelectAsset={handleSelectToAsset}
          value={toValue}
        />

        <Spacing h={40} />

        <Banner screenName={screenName} bottomPosition />

        {(isEstimating || showLoading) && (
          <EmptyStateWrapper>
            <Spinner />
          </EmptyStateWrapper>
        )}
        {!!errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
        {feeInfo?.fee && (
          <FooterContent>
            <FeeText>{t('Fee') + ' ' + feeInFiatDisplayValue}</FeeText>
            <SwipeButton confirmTitle={t('button.swipeSend')} onPress={onSubmit} />
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

const FooterContent = styled.View``;

const FeeText = styled.Text`
  text-align: center;
  color: ${({ theme }) => theme.colors.hazardIconColor};
  font-size: ${fontSizes.regular}px;
  margin: 20px;
`;

const ErrorMessage = styled(Text)`
  margin-bottom: 15px;
  text-align: center;
  color: ${({ theme }) => theme.colors.negative};
`;
