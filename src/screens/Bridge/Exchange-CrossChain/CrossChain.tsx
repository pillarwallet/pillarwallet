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
import { Keyboard, Platform } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';
import { BigNumber } from 'bignumber.js';
import { useDebounce } from 'use-debounce';

// Components
import { Container, Content, Spacing } from 'components/layout/Layout';
import Icon from 'components/core/Icon';
import Spinner from 'components/Spinner';
import Banner from 'components/Banner/Banner';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Text from 'components/core/Text';
import SwapButton from 'components/legacy/Button';

// Constants
import { CHAIN } from 'constants/chainConstants';
import { SEND_TOKEN_PIN_CONFIRM, EXCHANGE_CONFIRM } from 'constants/navigationConstants';
import { TRANSACTION_TYPE } from 'constants/transactionsConstants';

// Utils
import { useChainConfig } from 'utils/uiConfig';
import { nativeAssetPerChain } from 'utils/chains';
import { addressesEqual } from 'utils/assets';
import { getActiveScreenName } from 'utils/navigation';
import { getAssetRateInFiat, fiatTokenValue } from 'utils/rates';
import { mapTransactionsToTransactionPayload, showTransactionRevertedToast } from 'utils/transactions';
import { currentDate, currentTime } from 'utils/date';
import { isLogV2AppEvents } from 'utils/environment';
import { getAccountType } from 'utils/accounts';

// Selectors
import { useFiatCurrency, useChainRates, useActiveAccount } from 'selectors';

// Types
import type { AssetOption } from 'models/Asset';
import type { Chain } from 'models/Chain';
import type { TransactionPayload } from 'models/Transaction';

// Local
import FromAssetSelector from './FromAssetSelector';
import ToAssetSelector from './ToAssetSelector';
import { useFromAssets, useToAssetsCrossChain, useCrossChainBuildTransactionQuery, useGasFeeAssets } from './utils';
import OfferCard from './OfferCard';
import GasFeeAssetSelection from './GasFeeAssetSelection';

// Actions
import { resetEstimateTransactionAction } from 'actions/transactionEstimateActions';
import { fetchSingleChainAssetRatesAction } from 'actions/ratesActions';
import { appsFlyerlogEventAction } from 'actions/analyticsActions';

// Hooks
import { useTransactionFeeCheck } from 'hooks/transactions';

interface Props {
  fetchCrossChainTitle: (val: string) => void;
}

function CrossChain({ fetchCrossChainTitle }: Props) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const fromInputRef: any = React.useRef();
  const screenName = getActiveScreenName(navigation);
  const activeAccount = useActiveAccount();

  const initialChain: Chain = navigation.getParam('chain');
  const initialFromAddress: string =
    navigation.getParam('fromAssetAddress') || nativeAssetPerChain[initialChain]?.address;

  const [chain, setChain] = React.useState(initialChain);
  const [toAddressChain, setToAddressChain] = React.useState(null);
  const [fromAddress, setFromAddress] = React.useState(initialFromAddress);
  const [toAddress, setToAddress] = React.useState(null);
  const [fromValue, setFromValue] = React.useState(null);
  const [debouncedFromValue] = useDebounce(fromValue, 500);

  const [failEstimateOffer, setFailEstimateOffer] = React.useState(false);

  const [gasFeeAsset, setGasFeeAsset] = React.useState<AssetOption | null>(null);
  const [feeInfo, setFeeInfo] = React.useState(null);

  const fromOptions = useFromAssets();
  const toOptions = useToAssetsCrossChain(chain);
  const chainConfig = useChainConfig(chain);
  const toChainConfig = useChainConfig(toAddressChain || CHAIN.ETHEREUM);

  const gasFeeAssets = useGasFeeAssets(chain);

  React.useEffect(() => {
    dispatch(resetEstimateTransactionAction());
  }, []);

  const fromAsset = React.useMemo(
    () => fromOptions.find((a) => a.chain === chain && addressesEqual(a.address, fromAddress)),
    [fromOptions, fromAddress, chain],
  );

  const toAsset = React.useMemo(() => {
    const asset = toOptions?.find((a) => a.chain === toAddressChain && addressesEqual(a.address, toAddress));
    return asset;
  }, [toOptions, toAddress, chain]);

  const rates = useChainRates(toAddressChain);
  const currency = useFiatCurrency();
  const rate = getAssetRateInFiat(rates, toAsset?.address, currency);

  React.useEffect(() => {
    setFeeInfo(null);
  }, [fromAddress, toAddress, fromValue]);

  React.useEffect(() => {
    if (!fromInputRef || fromValue) return;
    fromInputRef.current?.focus();
  }, [fromAsset, toAsset]);

  const customCrosschainTitle = !fromAsset
    ? t('exchangeContent.title.crossChain')
    : chainConfig.titleShort + ' → ' + (toAddressChain ? toChainConfig.titleShort : '');

  React.useEffect(() => {
    fetchCrossChainTitle && fetchCrossChainTitle(customCrosschainTitle);
  }, [chain, customCrosschainTitle, fetchCrossChainTitle, fromAddress, toAddress]);

  const buildTractionQuery = useCrossChainBuildTransactionQuery(fromAsset, toAsset, debouncedFromValue);
  const buildTransactionData = buildTractionQuery.data;
  const buildTransactionFetched = buildTractionQuery.isFetched;

  const txData = React.useMemo(() => {
    if (!buildTransactionData) return null;
    const { transactions } = buildTransactionData;
    return transactions;
  }, [buildTransactionData]);

  const offer = React.useMemo(() => {
    if (!buildTransactionData) return null;
    const { toAmount, fromToken, toToken, gasCostUSD } = buildTransactionData.route;

    const decimalValue: any = `10e${toToken?.decimals - 1}`;

    const amount: any = parseInt(toAmount) / (decimalValue ?? 1);

    return {
      provider: 'Lifi',
      chain,
      gasFeeAsset,
      toChain: toAddressChain,
      transactions: txData,
      fromAsset: fromToken,
      toAsset: toToken,
      fromAmount: fromValue,
      toAmount: new BigNumber(amount),
      exchangeRate: amount,
      gasCost: fiatTokenValue(Number(gasCostUSD), rates, currency, null, 2),
    };
  }, [buildTransactionData]);

  const handleSelectFromAsset = (asset: AssetOption) => {
    setChain(asset.chain);
    setFromAddress(asset.address);
    if (chain !== asset.chain) {
      setToAddress(null);
      setToAddressChain(null);
    }
  };

  const handleSelectToAsset = (asset: AssetOption) => {
    setToAddress(asset.address);
    setToAddressChain(asset.chain);
    dispatch(fetchSingleChainAssetRatesAction(asset.chain, asset));
  };

  const showLoading = buildTractionQuery.isLoading;
  const ratesNotFound = toAsset && fromValue ? rate === 0 : false;

  React.useEffect(() => {
    if (showLoading) {
      setFailEstimateOffer(false);
    }
  }, [showLoading]);

  const confirmTransaction = () => {
    if (!feeInfo) {
      showTransactionRevertedToast();
      return;
    }

    let transactionPayload: TransactionPayload = mapTransactionsToTransactionPayload(chain, offer.transactions);
    transactionPayload = {
      ...transactionPayload,
      offer: {
        ...offer,
        feeInfo,
      },
      type: TRANSACTION_TYPE.EXCHANGE,
      gasToken: gasFeeAsset,
    };

    if (activeAccount && isLogV2AppEvents) {
      dispatch(
        appsFlyerlogEventAction(`swap_completed_${fromAsset?.symbol}_${toAsset?.symbol}`, {
          tokenPair: `${fromAsset?.symbol}_${toAsset?.symbol}`,
          chain,
          amount_swapped: offer.fromAmount,
          date: currentDate(),
          time: currentTime(),
          platform: Platform.OS,
          address: toAsset.address,
          walletType: getAccountType(activeAccount),
        }),
      );
    }

    navigation.navigate(SEND_TOKEN_PIN_CONFIRM, {
      transactionPayload,
      toAssetSymbol: toAsset.symbol,
      goBackDismiss: true,
      transactionType: TRANSACTION_TYPE.EXCHANGE,
    });
  };

  const { errorMessage } = useTransactionFeeCheck(chain || CHAIN.ETHEREUM, feeInfo, fromAsset, offer?.fromAmount);

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
          value={offer?.exchangeRate}
          isFetching={showLoading}
          searchTokenList={toOptions}
        />

        <Spacing h={20} />

        {gasFeeAssets && toAddress && fromValue && (
          <GasFeeAssetSelection
            assets={gasFeeAssets}
            chain={chain}
            selectAsset={gasFeeAsset}
            onSelectAsset={setGasFeeAsset}
          />
        )}

        <Spacing h={20} />

        {showLoading && (
          <EmptyStateWrapper>
            <Spinner />
          </EmptyStateWrapper>
        )}

        {offer && !ratesNotFound && (
          <>
            <OfferCard
              isVisible
              key={offer.provider}
              crossChainTxs={txData}
              offer={offer}
              disabled={false}
              isLoading={false}
              gasFeeAsset={gasFeeAsset}
              isSelected={true}
              onFeeInfo={setFeeInfo}
              onEstimateFail={() => {
                setFailEstimateOffer(true);
              }}
            />
            <Spacing h={30} />
            {!!errorMessage && <ErrorMessage>{errorMessage}</ErrorMessage>}
            {feeInfo && (
              <SwapButton
                style={{ borderRadius: 14 }}
                disabled={!!errorMessage}
                title={t('button.swap')}
                onPress={confirmTransaction}
              />
            )}
          </>
        )}

        {((!buildTransactionData && buildTransactionFetched) ||
          failEstimateOffer ||
          (ratesNotFound && !showLoading)) && (
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

const ErrorMessage = styled(Text)`
  margin-bottom: 15px;
  text-align: center;
  color: ${({ theme }) => theme.colors.negative};
`;
