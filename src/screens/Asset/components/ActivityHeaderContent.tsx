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
import { useTranslation } from 'translations/translate';
import styled from 'styled-components/native';

// Utils
import { fiatTokenValue } from 'utils/rates';
import { wrapBigNumberOrNil } from 'utils/bigNumber';
import { useThemeColors } from 'utils/themes';

// Components
import Text from 'components/core/Text';
import { Spacing } from 'components/legacy/Layout';

// Selectors
import { useRatesPerChain, useFiatCurrency } from 'selectors';

// Types
import type { TokenDetails } from 'models/Asset';
import type { Chain } from 'models/Chain';

interface Props {
  tokenDetails: TokenDetailsProps;
  chain: Chain;
  isPoolActivity?: boolean;
}

type TokenDetailsProps = {
  data: TokenDetails;
  isLoading: boolean;
};

const ActivityHeaderContent = ({ chain, tokenDetails, isPoolActivity }: Props) => {
  const currency = useFiatCurrency();
  const colors = useThemeColors();
  const ratesPerChain = useRatesPerChain();
  const { t } = useTranslation();

  const { data: tokenDetailsData } = tokenDetails;

  const priceChangePercentage = isPoolActivity
    ? tokenDetailsData?.liquidityUSDChangePercentage24h
    : tokenDetailsData?.tradingVolumeChangePercentage;

  const isPositive = priceChangePercentage === 0 || wrapBigNumberOrNil(priceChangePercentage)?.gt(0);

  const liquidityValue = tokenDetailsData?.liquidityUSD
    ? fiatTokenValue(tokenDetailsData?.liquidityUSD, ratesPerChain[chain], currency)
    : null;

  const tradingvolume = tokenDetailsData?.tradingVolume
    ? fiatTokenValue(tokenDetailsData?.tradingVolume, ratesPerChain[chain], currency)
    : null;

  const valueFromPercentage = useMemo(() => {
    if (!priceChangePercentage) return null;
    if (isPoolActivity && !tokenDetailsData?.liquidityUSD) return null;
    if (!isPoolActivity && !tokenDetailsData?.tradingVolume) return null;

    const tokenValue = isPoolActivity ? tokenDetailsData?.liquidityUSD : tokenDetailsData?.tradingVolume;

    const changedPriceValue = (tokenValue * priceChangePercentage) / 100;

    return fiatTokenValue(isPositive ? changedPriceValue : changedPriceValue * -1, ratesPerChain[chain], currency);
  }, [priceChangePercentage]);

  const visibleLabel = (!!liquidityValue && !!isPoolActivity) || (!!tradingvolume && !isPoolActivity);
  const visiblePercentage = !!visibleLabel && !!priceChangePercentage && priceChangePercentage !== 0;

  return (
    <>
      {visibleLabel && <Spacing h={20} />}
      {liquidityValue && isPoolActivity && (
        <Text variant="large" color={colors.basic000}>
          {liquidityValue}
        </Text>
      )}
      {tradingvolume && !isPoolActivity && <Text variant="large">{tradingvolume}</Text>}
      <Spacing h={6} />
      {visiblePercentage && (
        <RowContainer>
          <Text variant="small" color={colors.tertiaryText}>
            {t('button.today')}
          </Text>
          <Spacing w={4} />
          <Text variant="regular" color={isPositive ? colors.positive : colors.negative}>
            {isPositive && '+'}
            {priceChangePercentage?.toFixed(2)}% {valueFromPercentage && `(${valueFromPercentage})`}
          </Text>
        </RowContainer>
      )}
      {visibleLabel && <Spacing h={visiblePercentage ? 36 : 18} />}
    </>
  );
};

const RowContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: center;
  width: 90%;
`;

export default ActivityHeaderContent;
