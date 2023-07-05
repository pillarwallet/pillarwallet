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

import React, { FC, useEffect, useMemo } from 'react';
import { useTranslation } from 'translations/translate';
import { BigNumber } from 'bignumber.js';

// Components
import { Spacing } from 'components/layout/Layout';

// Utils
import { formatTokenValue } from 'utils/format';
import { getAssetValueInFiat } from 'utils/rates';
import { useChainsConfig } from 'utils/uiConfig';
import { getSortingValue } from 'screens/Bridge/Exchange-CrossChain/utils'; // From Cross-chain screen

// Types
import type { ExchangeOffer } from 'models/Exchange';
import type { Asset, AssetOption } from 'models/Asset';
import type { TransactionFeeInfo } from 'models/Transaction';

// Selectors
import { useRootSelector, useFiatCurrency, useChainRates, useActiveAccount } from 'selectors';
import { gasThresholdsSelector } from 'redux/selectors/gas-threshold-selector';

// Hooks
import { useTransactionsEstimate } from 'hooks/transactions';
import RouteCard from './RouteCard';

type IBridgeRouteCard = {
  value?: BigNumber | null;
  selectedToken?: AssetOption;
  onPress?: () => Promise<void>;
  gasFeeAsset: Asset | AssetOption;
  plrToken?: AssetOption;
  setStkPlrAmount?: (value: BigNumber) => void;
  setOfferData?: (offer: any) => void;
  onFetchSortingOfferInfo?: (offerInfo: ExchangeOffer) => void;
  onFeeInfo?: (feeInfo: TransactionFeeInfo | null) => void;
  onEstimateFail?: () => void;
  buildTransactionData?: any;
  buildTransactionFetched?: any;
  fromChain: string;
  stakeFeeInfo: any;
  stakeGasFeeAsset: Asset | AssetOption;
  isBridging?: boolean;
  isStaking?: boolean;
  stakingCompleted?: boolean;
};

const BridgeRouteCard: FC<IBridgeRouteCard> = ({
  value,
  selectedToken,
  gasFeeAsset,
  plrToken,
  setStkPlrAmount,
  setOfferData,
  onFetchSortingOfferInfo,
  onFeeInfo,
  onEstimateFail,
  buildTransactionData,
  fromChain,
  stakeFeeInfo,
  stakeGasFeeAsset,
}) => {
  const { t } = useTranslation();
  const fiatCurrency = useFiatCurrency();
  const chainsConfig = useChainsConfig();

  const txData = useMemo(() => {
    if (!buildTransactionData || !plrToken) return null;
    const { approvalTransactionData, transactionData } = buildTransactionData;
    if (!approvalTransactionData) return [transactionData];
    return [approvalTransactionData, transactionData];
  }, [buildTransactionData]);

  const offer = useMemo(() => {
    if (!buildTransactionData || !plrToken) return null;
    const {
      provider,
      estimate: { data, toAmount },
    } = buildTransactionData.quote;
    const { fromToken, toToken } = data;

    const decimalValue: any = `10e${toToken?.decimals - 1}`;

    const amount: any = parseInt(toAmount) / (decimalValue ?? 1);

    return {
      provider: provider === 'lifi' ? 'Lifi' : provider,
      fromChain,
      gasFeeAsset,
      toChain: plrToken.chain,
      transactions: txData,
      fromAsset: fromToken,
      toAsset: toToken,
      fromAmount: value,
      toAmount: new BigNumber(amount),
      exchangeRate: amount,
    };
  }, [buildTransactionData]);

  useEffect(() => {
    setOfferData(offer || null);
    setStkPlrAmount(offer?.toAmount || null);
  }, [offer]);

  const { toChain, toAsset, toAmount } = offer;

  const { titleShort: networkName } = chainsConfig[toChain];

  const rates = useChainRates(toChain || fromChain);
  const currency = useFiatCurrency();

  const fiatValue = getAssetValueInFiat(toAmount, toAsset?.address, rates, currency) ?? null;

  const {
    feeInfo,
    errorMessage: estimationErrorMessage,
    isEstimating,
  } = useTransactionsEstimate(fromChain, txData || offer?.transactions, true, gasFeeAsset);

  const chainRates = useChainRates(fromChain);

  const formattedToAmount = formatTokenValue(offer.toAmount, offer.toAsset.symbol, { decimalPlaces: 0 }) ?? '';

  const formattedFromAmount = formatTokenValue(offer.fromAmount, offer.fromAsset.symbol, { decimalPlaces: 0 }) ?? '';

  useEffect(() => {
    if (estimationErrorMessage) {
      onEstimateFail && onEstimateFail();
    }
  }, [estimationErrorMessage]);

  useEffect(() => {
    onFeeInfo && onFeeInfo(feeInfo);
    onFetchSortingOfferInfo &&
      onFetchSortingOfferInfo({
        ...offer,
        feeInfo,
        sortingValue: getSortingValue(toChain || fromChain, feeInfo, chainRates, fiatCurrency, fiatValue),
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeInfo, estimationErrorMessage, isEstimating]);

  // Display route
  if (!offer) return null;

  return (
    <>
      <Spacing h={8} />

      <RouteCard
        selected={true}
        chain={selectedToken?.chain}
        plrToken={plrToken}
        formattedFromAmount={formattedFromAmount}
        formattedToAmount={formattedToAmount}
        networkName={networkName}
        provider={offer?.provider}
        stakeFeeInfo={stakeFeeInfo}
        stakeGasFeeAsset={stakeGasFeeAsset}
        gasFeeAsset={gasFeeAsset}
        transactions={offer?.transactions}
      />
    </>
  );
};

export default BridgeRouteCard;
