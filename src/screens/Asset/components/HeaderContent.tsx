// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

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
import React, { useMemo } from 'react';
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';

// Utils
import { useThemeColors } from 'utils/themes';
import { getGraphPeriod, getPriceChangePercentage } from 'utils/assets';
import { getCurrencySymbol, nFormatter } from 'utils/common';
import { wrapBigNumberOrNil } from 'utils/bigNumber';
import { fiatTokenValue } from 'utils/rates';

// Selectors
import { useRatesPerChain, useFiatCurrency } from 'selectors';

// Components
import Text from 'components/core/Text';
import { Spacing } from 'components/legacy/Layout';

// Types
import type { MarketDetails, TokenDetails } from 'models/Asset';
import type { Chain } from 'models/Chain';

// Local
import { HeaderLoader } from './Loaders';

interface Props {
  period: string;
  tokenRate: number;
  marketDetails: MarketDetailsProps;
  tokenDetails: TokenDetailsProps;
  chain: Chain;
}

type MarketDetailsProps = {
  data: MarketDetails;
  isLoading: boolean;
};

type TokenDetailsProps = {
  data: TokenDetails;
  isLoading: boolean;
};

const HeaderContent = ({ period, chain, tokenRate, marketDetails, tokenDetails }: Props) => {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const ratesPerChain = useRatesPerChain();
  const currency = useFiatCurrency();

  const currencySymbol = getCurrencySymbol(currency);

  const { data: tokenDetailsData, isLoading } = tokenDetails;
  const { data: marketDetailsData, isLoading: marketDetailsLoading } = marketDetails;

  const periodInfo = getGraphPeriod(period);
  const priceChangePercentage = getPriceChangePercentage(period, marketDetailsData, tokenDetailsData);

  const isPositive = priceChangePercentage === 0 || wrapBigNumberOrNil(priceChangePercentage).gt(0);

  const valueFromPercentage = useMemo(() => {
    const changedPriceValue = (tokenRate * priceChangePercentage) / 100;
    return fiatTokenValue(isPositive ? changedPriceValue : changedPriceValue * -1, ratesPerChain[chain], currency);
  }, [marketDetailsData, periodInfo]);

  const tokenVolume = useMemo(() => {
    if (!tokenDetailsData?.tradingVolume) return `${currencySymbol}0`;
    const { tradingVolume } = tokenDetailsData;
    return fiatTokenValue(tradingVolume, ratesPerChain[chain], currency, nFormatter);
  }, [tokenDetailsData]);

  if (isLoading || marketDetailsLoading) {
    return <HeaderLoader />;
  }

  const tokenValue = fiatTokenValue(tokenRate, ratesPerChain[chain], currency);

  return (
    <>
      <Text variant="large" color={colors.basic000}>
        {tokenValue}
      </Text>
      <Spacing h={6} />
      {priceChangePercentage !== 0 && (
        <RowContainer>
          <Text variant="small" color={colors.tertiaryText}>
            {periodInfo.balanceLabel}
          </Text>
          <Spacing w={4} />
          <Text variant="regular" color={isPositive ? colors.positive : colors.negative}>
            {isPositive && '+'}
            {priceChangePercentage?.toFixed(2)}% ({valueFromPercentage})
          </Text>
        </RowContainer>
      )}
      {!!tokenDetailsData?.tradingVolume && (
        <RowContainer>
          <Text variant="small" color={colors.tertiaryText}>
            {t('label.volume_24')}
          </Text>
          <Spacing w={4} />
          <Text variant="small" color={colors.basic000}>
            {tokenVolume}
          </Text>
        </RowContainer>
      )}
    </>
  );
};

export default HeaderContent;

const RowContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 90%;
`;
