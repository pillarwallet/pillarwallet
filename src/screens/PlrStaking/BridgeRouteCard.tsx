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
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';
import { BigNumber } from 'bignumber.js';

// Components
import Text from 'components/core/Text';
import { Spacing } from 'components/layout/Layout';

// Utils
import { useProviderConfig } from 'utils/exchange';
import { formatTokenValue, formatFiatValue } from 'utils/format';
import { fontStyles } from 'utils/variables';
import { getAssetValueInFiat } from 'utils/rates';
import { isHighGasFee } from 'utils/transactions';
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
  buildTransactionFetched,
}) => {
  const { t } = useTranslation();
  const activeAccount: any = useActiveAccount();
  const fiatCurrency = useFiatCurrency();
  const gasThresholds = useRootSelector(gasThresholdsSelector);
  const chainsConfig = useChainsConfig();

  console.log('activeAccount', activeAccount);

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
      chain,
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

  const config = useProviderConfig(offer?.provider);

  useEffect(() => {
    setOfferData(offer || null);
    setStkPlrAmount(offer?.toAmount || null);
  }, [offer]);

  const { chain, toChain, toAsset, toAmount } = offer;

  const { titleShort: networkName } = chainsConfig[toChain];

  const rates = useChainRates(toChain || chain);
  const currency = useFiatCurrency();

  const fiatValue = getAssetValueInFiat(toAmount, toAsset?.address, rates, currency) ?? null;
  const formattedFiatValue = formatFiatValue(fiatValue, currency);

  const {
    feeInfo,
    errorMessage: estimationErrorMessage,
    isEstimating,
  } = useTransactionsEstimate(chain, txData || offer?.transactions, true, gasFeeAsset);

  const chainRates = useChainRates(chain);

  const highFee = isHighGasFee(chain, feeInfo?.fee, feeInfo?.gasToken, chainRates, fiatCurrency, gasThresholds);

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
        sortingValue: getSortingValue(toChain || chain, feeInfo, chainRates, fiatCurrency, fiatValue),
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [feeInfo, estimationErrorMessage, isEstimating]);

  // if (estimationErrorMessage) {
  //   return null;
  // }

  // Display route
  if (!offer) return null;

  return (
    <>
      <Spacing h={16} />

      <RouteText>Route</RouteText>

      <Spacing h={8} />

      <RouteCard
        selected={true}
        chain={selectedToken?.chain}
        plrToken={plrToken}
        formattedFromAmount={formattedFromAmount}
        formattedToAmount={formattedToAmount}
        networkName={networkName}
        providerConfig={config}
        feeInfo={feeInfo}
        highFee={highFee}
      />
    </>
  );
};

export default BridgeRouteCard;

const EmptyStateWrapper = styled.View`
  justify-content: center;
  align-items: center;
`;

const RouteText = styled(Text)`
  ${fontStyles.big};
  color: ${({ theme }) => theme.colors.basic010};
`;

// Routes
const RouteWrapper = styled.View`
  flex-direction: column;
`;

const RouteContainer = styled.View`
  margin: 0 0 8px;
  padding: 20px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.colors.basic050};

  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const IconWrapper = styled.View`
  align-items: center;
  justify-content: center;
`;

const RouteInfoWrapper = styled.View`
  display: flex;
  flex: 1;
  flex-direction: column;
  padding-left: 16px;
  justify-content: center;
`;

const RouteInfoRow = styled.View`
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const MainText = styled(Text).attrs((props: { highlighted?: boolean }) => props)`
  ${fontStyles.medium};

  color: ${({ theme, highlighted }) => (highlighted ? theme.colors.plrStakingHighlight : theme.colors.basic000)};
`;

const SubText = styled(Text).attrs((props: { highlighted?: boolean }) => props)`
  ${fontStyles.regular};

  color: ${({ theme, highlighted }) => (highlighted ? theme.colors.plrStakingHighlight : theme.colors.basic000)};
`;

const RadioButtonWrapper = styled.View`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const HighlightText = styled(Text)`
  color: ${({ theme }) => theme.colors.plrStakingHighlight};
`;
