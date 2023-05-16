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

import React, { useEffect } from 'react';
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';
import { View } from 'react-native';

// Components
import Button from 'components/core/Button';
import Text from 'components/core/Text';
import DynamicSizeImage from 'components/DynamicSizeImage';
import { TableFee } from 'components/legacy/Table';
import Spinner from 'components/Spinner';
import RadioButton from 'components/RadioButton';
import { BaseText } from 'components/legacy/Typography';
import { Spacing } from 'components/layout/Layout';
import TokenIcon from 'components/display/TokenIcon';

// Constants
import { OFFERS } from 'constants/exchangeConstants';

// Utils
import { useProviderConfig } from 'utils/exchange';
import { formatTokenValue, formatFiatValue } from 'utils/format';
import { spacing, fontStyles } from 'utils/variables';
import { getAssetValueInFiat } from 'utils/rates';
import { getAccountAddress } from 'utils/accounts';
import { isHighGasFee } from 'utils/transactions';
import { useChainsConfig } from 'utils/uiConfig';

// Types
import type { ExchangeOffer } from 'models/Exchange';
import type { Asset, AssetOption } from 'models/Asset';
import type { TransactionFeeInfo } from 'models/Transaction';

// Selectors
import { useRootSelector, useFiatCurrency, useChainRates, useActiveAccount } from 'selectors';
import { gasThresholdsSelector } from 'redux/selectors/gas-threshold-selector';

// Hooks
import { useTransactionsEstimate } from 'hooks/transactions';

// Local
import { getSortingValue, appendFeeCaptureTransactionIfNeeded } from 'screens/Bridge/Exchange-CrossChain/utils';

type Props = {
  offer: ExchangeOffer;
  onPress?: () => Promise<void>;
  disabled?: boolean;
  isLoading?: boolean;
  crossChainTxs?: any[];
  onEstimateFail?: () => void;
  gasFeeAsset: Asset | AssetOption;
  onFetchSortingOfferInfo?: (offerInfo: ExchangeOffer) => void;
  isSelected?: boolean;
  onFeeInfo?: (feeInfo: TransactionFeeInfo | null) => void;
  plrToken?: AssetOption;
};

function OfferCard({
  offer,
  onPress,
  disabled,
  isLoading,
  crossChainTxs,
  onEstimateFail,
  gasFeeAsset,
  onFetchSortingOfferInfo,
  isSelected,
  onFeeInfo,
  plrToken,
}: Props) {
  const { t } = useTranslation();
  const config = useProviderConfig(offer.provider);
  const activeAccount: any = useActiveAccount();
  const fiatCurrency = useFiatCurrency();
  const gasThresholds = useRootSelector(gasThresholdsSelector);
  const chainsConfig = useChainsConfig();

  const [offerInfo, setOfferInfo] = React.useState(null);

  useEffect(() => {
    async function call() {
      const addTxsOffer = await appendFeeCaptureTransactionIfNeeded(offer, getAccountAddress(activeAccount));
      setOfferInfo(addTxsOffer);
    }
    call();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
  } = useTransactionsEstimate(chain, crossChainTxs || offerInfo?.transactions, true, gasFeeAsset);

  const chainRates = useChainRates(chain);

  const highFee = isHighGasFee(chain, feeInfo?.fee, feeInfo?.gasToken, chainRates, fiatCurrency, gasThresholds);

  const formattedToAmount = formatTokenValue(offer.toAmount, offer.toAsset.symbol, { decimalPlaces: 0 }) ?? '';

  // eslint-disable-next-line i18next/no-literal-string

  useEffect(() => {
    if (estimationErrorMessage) {
      onEstimateFail && onEstimateFail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  return (
    <>
      <RouteText>Route</RouteText>

      <Spacing h={8} />

      {/* <TouchableContainer disabled={disabled || isEstimating} onPress={() => onPress?.()}>
        <Row>
          <LeftColumn>
            <Label>{t('exchangeContent.label.estTime')}</Label>
            <BaseText>{t('label.half_min')}</BaseText>
          </LeftColumn>

          <RightColumn>
            <Row style={{ minHeight: 20 }}>
              {!!config?.iconHorizontal && (
                <DynamicSizeImage imageSource={config.iconHorizontal} fallbackHeight={130} fallbackWidth={32} />
              )}
              <RadioButton type={OFFERS} visible={isSelected} style={{ marginRight: 0, marginLeft: 12 }} />
            </Row>
          </RightColumn>
        </Row>

        <Row topSeparator>
          <LeftColumn>
            {isEstimating ? (
              <EmptyStateWrapper>
                <Spinner size={20} />
              </EmptyStateWrapper>
            ) : (
              <>
                <Label>{t('exchangeContent.label.estFee')}</Label>
                <TableFee txFeeInWei={feeInfo?.fee} gasToken={feeInfo?.gasToken} chain={chain} highFee={highFee} />
              </>
            )}
          </LeftColumn>

          <RightColumn>
            <Button onPress={onPress} disabled={disabled || isEstimating} size="compact" style={{ borderRadius: 6 }} />
          </RightColumn>
        </Row>
      </TouchableContainer> */}

      <RouteWrapper>
        <RouteContainer>
          <IconWrapper>{plrToken && <TokenIcon url={plrToken?.icon} size={48} chain={plrToken?.chain} />}</IconWrapper>

          <RouteInfoWrapper>
            <RouteInfoRow>
              <MainText>{formattedToAmount}</MainText>
              <MainText highlighted>{`on ${networkName}`}</MainText>
            </RouteInfoRow>

            <RouteInfoRow>
              <SubText>
                <HighlightText>Est. fee:</HighlightText>
                {` $53.2`}
              </SubText>
              <SubText>
                <HighlightText>Est. time:</HighlightText>
                {` 2 mins`}
              </SubText>
            </RouteInfoRow>
          </RouteInfoWrapper>

          <RadioButtonWrapper>
            <RadioButton type={OFFERS} visible={isSelected} style={{ marginRight: 0, marginLeft: 12 }} />
          </RadioButtonWrapper>
        </RouteContainer>
      </RouteWrapper>
    </>
  );
}

export default OfferCard;

const TouchableContainer = styled.TouchableOpacity`
  margin-bottom: ${spacing.mediumLarge}px;
  padding: 0 ${spacing.mediumLarge}px;
  background-color: ${({ theme }) => theme.colors.basic080};
  border-radius: 20px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  min-height: 70px;
  padding: 10px 0;
  ${({ theme, topSeparator }) => topSeparator && `border-top-width: 1px; border-top-color: ${theme.colors.card};`}
`;

const LeftColumn = styled.View`
  flex: 1;
  align-items: flex-start;
`;

const RightColumn = styled.View`
  align-items: flex-end;
  margin-left: ${spacing.mediumLarge}px;
`;

const Label = styled(Text)`
  ${fontStyles.regular};
  color: ${({ theme }) => theme.colors.secondaryText};
`;

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
  min-width: 48px;
`;

const RouteInfoWrapper = styled.View`
  display: flex;
  flex: 1;
  flex-direction: column;
  padding-left: 16px;
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
