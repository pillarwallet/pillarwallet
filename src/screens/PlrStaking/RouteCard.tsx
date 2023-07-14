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

import React, { FC } from 'react';
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Constants
import { OFFERS } from 'constants/exchangeConstants';
import { CHAIN } from 'constants/chainConstantsTs';

// Utils
import { fontStyles } from 'utils/variables';
import { useProviderConfig } from 'utils/exchange';
import { getBalanceInFiat } from 'utils/assets';
import { formatFiatValue } from 'utils/format';

// Selectors
import { useFiatCurrency, useChainRates } from 'selectors';

// Types
import type { Asset, AssetOption } from 'models/Asset';
import type { Chain } from 'models/Chain';
import type { TransactionFeeInfo } from 'models/Transaction';

// Hooks
import { useTransactionsEstimate } from 'hooks/transactions';

// Components
import TokenIcon from 'components/display/TokenIcon';
import RadioButton from 'components/RadioButton';
import Text from 'components/core/Text';
import { BigNumber, ethers } from 'ethers';

interface IRouteCard {
  offer?: any;
  selected?: boolean;
  chain?: Chain;
  plrToken?: AssetOption;
  formattedToAmount?: string;
  formattedFromAmount?: string;
  networkName?: string;
  provider?: any;
  highFee?: boolean;
  onSelectOffer?: (offer: any, feeInfo: TransactionFeeInfo | null) => void;
  disabled?: boolean;
  stakeFeeInfo: any;
  stakeGasFeeAsset: Asset | AssetOption;
  transactions: any;
  gasFeeAsset: Asset | AssetOption;
}

const RouteCard: FC<IRouteCard> = ({
  offer,
  selected,
  chain,
  plrToken,
  formattedToAmount,
  formattedFromAmount,
  networkName,
  provider,
  onSelectOffer,
  disabled,
  stakeFeeInfo,
  stakeGasFeeAsset,
  transactions,
  gasFeeAsset,
}) => {
  const { t, tRoot } = useTranslationWithPrefix('plrStaking.validator');

  const currency = useFiatCurrency();
  const chainRates = useChainRates(chain);
  const ethRates = useChainRates(CHAIN.ETHEREUM);

  const config = useProviderConfig(provider);

  const { feeInfo } = useTransactionsEstimate(chain, transactions, true, gasFeeAsset);

  const feeEtherValueBn = feeInfo?.fee ? BigNumber.from(feeInfo.fee.toString()) : null;
  const stakeFeeEtherValueBn = stakeFeeInfo ? BigNumber.from(stakeFeeInfo.toString()) : null;

  const getFiatValue = (value: BigNumber, address: string, isEthereum?: boolean) => {
    if (!value) return null;

    const etherValue = ethers.utils.formatEther(value);
    const valueInFiat = getBalanceInFiat(currency, etherValue, !!isEthereum ? ethRates : chainRates, address);
    return valueInFiat;
  };

  const getTotalGasFees = () => {
    let totalFiatValue = 0;
    if (feeEtherValueBn) totalFiatValue += getFiatValue(feeEtherValueBn, gasFeeAsset.address) || 0;
    if (stakeFeeEtherValueBn) totalFiatValue += getFiatValue(stakeFeeEtherValueBn, stakeGasFeeAsset.address, true) || 0;
    return totalFiatValue;
  };

  return (
    <RouteWrapper>
      <RouteContainer onPress={() => onSelectOffer?.(offer, feeInfo)} disabled={disabled || !onSelectOffer}>
        <IconWrapper>{plrToken && <TokenIcon url={plrToken?.iconUrl} size={48} chain={plrToken?.chain} />}</IconWrapper>

        <RouteInfoContainer>
          <RouteInfoRow>
            <MainText>{formattedToAmount}</MainText>
            <MainText highlighted>{`${t('on')} ${networkName}`}</MainText>
          </RouteInfoRow>

          <RouteInfoRow>
            <GasPriceWrapper>
              <SubText>
                <HighlightText>{`${t('estFee')} `}</HighlightText>
                {formatFiatValue(getTotalGasFees(), currency)}
              </SubText>
            </GasPriceWrapper>
            <SubText>
              <HighlightText>{t('estTime')}</HighlightText>
              {` 2 mins`}
            </SubText>
          </RouteInfoRow>
        </RouteInfoContainer>

        <RadioButtonWrapper>
          <RadioButton type={OFFERS} visible={selected} style={{ marginRight: 0, marginLeft: 12 }} />
        </RadioButtonWrapper>
      </RouteContainer>

      <RouteBreakdownWrapper>
        <Circle />
        <RouteBreakdownContainer>
          <IconWrapper>{config && <TokenIcon url={config.iconUrl} size={32} chain={plrToken?.chain} />}</IconWrapper>

          <RouteInfoContainer>
            <RouteInfoRow>
              <MainText>{t('swapVia', { title: config?.title, networkName })}</MainText>
            </RouteInfoRow>

            <RouteInfoRow>
              <MainText>{`${formattedFromAmount} → ${formattedToAmount}`}</MainText>
            </RouteInfoRow>

            <RouteInfoRow>
              <GasPriceWrapper>
                <SubText>
                  <HighlightText>{`${t('estFee')} `}</HighlightText>
                  {feeEtherValueBn && formatFiatValue(getFiatValue(feeEtherValueBn, gasFeeAsset.address), currency)}
                </SubText>
              </GasPriceWrapper>
            </RouteInfoRow>
          </RouteInfoContainer>
        </RouteBreakdownContainer>
      </RouteBreakdownWrapper>

      <RouteBreakdownWrapper>
        <Circle />
        <RouteBreakdownContainer>
          <IconWrapper>
            {plrToken && <TokenIcon url={plrToken?.iconUrl} size={32} chain={plrToken?.chain} />}
          </IconWrapper>

          <RouteInfoContainer>
            <RouteInfoRow>
              <MainText>{t('stakeOn', { formattedAmount: formattedToAmount, networkName })}</MainText>
            </RouteInfoRow>
            <RouteInfoRow>
              <GasPriceWrapper>
                <SubText>
                  <HighlightText>{`${t('estFee')} `}</HighlightText>
                  {stakeFeeEtherValueBn &&
                    formatFiatValue(getFiatValue(stakeFeeEtherValueBn, stakeGasFeeAsset.address, true), currency)}
                </SubText>
              </GasPriceWrapper>
            </RouteInfoRow>
          </RouteInfoContainer>
        </RouteBreakdownContainer>
      </RouteBreakdownWrapper>
    </RouteWrapper>
  );
};

export default RouteCard;
// Routes
const RouteWrapper = styled.View`
  flex-direction: column;
`;

const RouteContainer = styled.TouchableOpacity`
  margin: 0 0 8px;
  padding: 10px 10px 12px 16px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.colors.basic050};

  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const RouteBreakdownWrapper = styled.View`
  display: flex;
  flex: 1;
  flex-direction: row;
  align-items: center;
  margin: 0 0 8px;
`;

const Circle = styled.View<{ active?: boolean }>`
  height: 10px;
  width: 10px;
  margin-right: 8px;
  background-color: ${({ theme, active }) => (active ? theme.colors.positive : 'rgba(0,0,0,0)')};
  border: 1px ${({ theme }) => theme.colors.basic080} solid;
  border-radius: 10px;
`;

const RouteBreakdownContainer = styled.View`
  padding: 10px;
  border-radius: 20px;
  background-color: ${({ theme }) => theme.colors.basic050};

  flex: 1;
  display: flex;
  flex-direction: row;
  justify-content: space-between;
`;

const IconWrapper = styled.View`
  align-items: center;
  justify-content: center;
`;

const RouteInfoContainer = styled.View`
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

const GasPriceWrapper = styled.View`
  display: flex;
  flex-direction: row;
  align-items: center;
`;

const RadioButtonWrapper = styled.View`
  display: flex;
  justify-content: center;
  align-items: center;
`;

const HighlightText = styled(Text)`
  color: ${({ theme }) => theme.colors.plrStakingHighlight};
`;