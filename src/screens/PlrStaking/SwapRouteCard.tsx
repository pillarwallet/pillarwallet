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

import React, { FC, useState } from 'react';
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';
import { BigNumber } from 'bignumber.js';

// Utils
import { useProviderConfig } from 'utils/exchange';
import { formatTokenValue } from 'utils/format';
import { fontStyles } from 'utils/variables';
import { isHighGasFee } from 'utils/transactions';
import { useChainsConfig } from 'utils/uiConfig';
import { getAssetRateInFiat } from 'utils/rates';

// Types
import type { Asset, AssetOption } from 'models/Asset';
import type { TransactionFeeInfo } from 'models/Transaction';
import type { Chain } from 'models/Chain';

// Selectors
import { useRootSelector, useFiatCurrency, useChainRates, useActiveAccount } from 'selectors';
import { gasThresholdsSelector } from 'redux/selectors/gas-threshold-selector';

// Hooks
import { useTransactionsEstimate } from 'hooks/transactions';

// Components
import Text from 'components/core/Text';
import { Spacing } from 'components/layout/Layout';
import RouteCard from './RouteCard';

interface ISwapRouteCard {
  value?: BigNumber;
  selectedToken?: AssetOption;
  chain?: Chain;
  offers?: any;
  selectedOffer?: any;
  disabled?: boolean;
  onEstimateFail?: () => void;
  gasFeeAsset: Asset | AssetOption;
  plrToken?: AssetOption;
  setStkPlrAmount?: (value: BigNumber) => void;
  setOfferData?: (offer: any) => void;
  onFeeInfo?: (feeInfo: TransactionFeeInfo | null) => void;
}

const SwapRouteCard: FC<ISwapRouteCard> = ({
  value,
  selectedToken,
  chain,
  offers,
  selectedOffer = null,
  disabled,
  onEstimateFail,
  gasFeeAsset,
  plrToken,
  setOfferData,
  setStkPlrAmount,
  onFeeInfo,
}) => {
  const { t } = useTranslation();
  const activeAccount: any = useActiveAccount();
  const fiatCurrency = useFiatCurrency();
  const gasThresholds = useRootSelector(gasThresholdsSelector);
  const chainsConfig = useChainsConfig();
  const { titleShort: networkName } = chainsConfig[chain];

  const rates = useChainRates(chain);
  const currency = useFiatCurrency();
  const rate = getAssetRateInFiat(rates, plrToken?.address, currency);

  const [selectedOfferProvider, setSelectedOfferProvider] = useState(null);
  const [sortedOffersList, setSortedOfferList] = useState([]);

  const [showMore, setShowMore] = useState(false);

  const {
    feeInfo,
    errorMessage: estimationErrorMessage,
    isEstimating,
  } = useTransactionsEstimate(chain, selectedOffer?.transactions, true, gasFeeAsset);

  const highFee = isHighGasFee(
    chain,
    selectedOffer?.feeInfo?.fee,
    selectedOffer?.feeInfo?.gasToken,
    rates,
    fiatCurrency,
    gasThresholds,
  );

  const formattedToAmount =
    formatTokenValue(selectedOffer?.toAmount, selectedOffer?.toAsset.symbol, { decimalPlaces: 0 }) ?? '';

  const formattedFromAmount =
    formatTokenValue(selectedOffer?.fromAmount, selectedOffer?.fromAsset.symbol, { decimalPlaces: 0 }) ?? '';

  const config = useProviderConfig(selectedOffer?.provider);

  const onSelectOffer = (offer: any, feeInfo: TransactionFeeInfo | null) => {
    if (!offer?.provider || selectedOffer?.provider === offer.provider || !feeInfo) return;

    setOfferData?.(offer);
    onFeeInfo?.(feeInfo);
  };

  if (!offers?.length) return null;

  return (
    <>
      <Spacing h={16} />

      <RouteText>Route</RouteText>

      {selectedOffer && (
        <>
          <Spacing h={8} />

          <RouteCard
            selected={selectedOffer?.provider === selectedOfferProvider}
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
      )}

      {(!selectedOffer || showMore) &&
        offers.map((offer, i) => {
          const config = useProviderConfig(offer?.provider);

          const {
            feeInfo,
            errorMessage: estimationErrorMessage,
            isEstimating,
          } = useTransactionsEstimate(chain, offer?.transactions, true, gasFeeAsset);

          const highFee = isHighGasFee(
            chain,
            offer?.feeInfo?.fee,
            offer?.feeInfo?.gasToken,
            rates,
            fiatCurrency,
            gasThresholds,
          );

          const formattedToAmount = formatTokenValue(offer.toAmount, offer.toAsset.symbol, { decimalPlaces: 0 }) ?? '';

          const formattedFromAmount =
            formatTokenValue(offer.fromAmount, offer.fromAsset.symbol, { decimalPlaces: 0 }) ?? '';

          if (!selectedOffer && !showMore && i !== 0) return null;

          if (offer?.provider === selectedOfferProvider) return null;
          return (
            <>
              <Spacing h={8} />

              <RouteCard
                offer={offer}
                selected={offer.provider === selectedOfferProvider}
                chain={selectedToken?.chain}
                plrToken={plrToken}
                formattedFromAmount={formattedFromAmount}
                formattedToAmount={formattedToAmount}
                networkName={networkName}
                providerConfig={config}
                feeInfo={feeInfo}
                highFee={highFee}
                onSelectOffer={onSelectOffer}
              />
            </>
          );
        })}

      {offers?.length > 1 && (
        <>
          <Spacing h={16} />

          <ShowMoreButton onPress={setShowMore((current) => !current)}>
            <ShowMoreText>{showMore ? 'Show less' : 'Show more'}</ShowMoreText>
          </ShowMoreButton>
        </>
      )}
    </>
  );
};

export default SwapRouteCard;

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

const ShowMoreButton = styled.TouchableOpacity`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ShowMoreText = styled(Text)`
  color: ${({ theme }) => theme.colors.basic000};
`;
