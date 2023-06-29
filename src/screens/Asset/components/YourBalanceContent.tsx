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
import { getGraphPeriod } from 'utils/assets';
import { convertDecimalNumber } from 'utils/common';
import { wrapBigNumberOrNil } from 'utils/bigNumber';
import { fiatTokenValue } from 'utils/rates';

// Constants
import { ONE_DAY } from 'constants/assetsConstants';

// Selectors
import { useRatesPerChain, useFiatCurrency } from 'selectors';

// Components
import Text from 'components/core/Text';
import { Spacing } from 'components/legacy/Layout';

// Local
import { BalanceLoader } from './Loaders';
import { isEmpty } from 'lodash';

const YourBalanceContent = ({ period, tokenRate, balance, marketDetails, assetData }) => {
  const colors = useThemeColors();
  const { t } = useTranslation();
  const ratesPerChain = useRatesPerChain();
  const currency = useFiatCurrency();

  const { token, chain } = assetData;

  const { data: marketDetailsData, isLoading: marketDetailsLoading } = marketDetails;

  const isWalletEmpty = balance <= 0;
  const totalInFiat = isWalletEmpty ? 0 : balance * tokenRate;
  const fiatAmount = fiatTokenValue(totalInFiat, ratesPerChain[chain], currency, convertDecimalNumber);

  const periodInfo = getGraphPeriod(ONE_DAY);

  const oneDayChangePercentage = useMemo(() => {
    const zeroPercentage = 0;
    if (isEmpty(marketDetailsData)) return zeroPercentage;
    const { priceChangePercentage24h } = marketDetailsData;

    if (!priceChangePercentage24h) return zeroPercentage;

    return priceChangePercentage24h;
  }, [marketDetailsData]);

  const isPositive = oneDayChangePercentage === 0 || wrapBigNumberOrNil(oneDayChangePercentage).gt(0);

  const changedPercentageValue = useMemo(() => {
    const changedPriceValue = (totalInFiat * oneDayChangePercentage) / 100;

    return fiatTokenValue(
      isPositive ? changedPriceValue : changedPriceValue * -1,
      ratesPerChain[chain],
      currency,
      convertDecimalNumber,
    );
  }, [marketDetailsData, period]);

  const changePercentage = `${oneDayChangePercentage?.toFixed(2)}%`;
  const isZeroBalance = totalInFiat === 0;

  return (
    <Container>
      <RowContainer>
        <Text variant={'small'} color={colors.tertiaryText}>
          {t('label.your_balance')}
        </Text>
        {!isZeroBalance && (
          <Text variant={'small'} color={colors.tertiaryText}>
            {periodInfo.label}
          </Text>
        )}
      </RowContainer>
      <Spacing h={5} />
      {marketDetailsLoading ? (
        <BalanceLoader />
      ) : (
        <>
          <RowContainer>
            <Text style={{ fontSize: 20 }} color={colors.basic000}>
              {fiatAmount}
            </Text>
            {!isZeroBalance && (
              <Text style={{ fontSize: 20 }} color={isPositive ? colors.positive : colors.negative}>
                {changedPercentageValue}
              </Text>
            )}
          </RowContainer>
          <RowContainer>
            <Text variant={'small'} color={colors.tertiaryText}>
              {t('tokenValue', { value: balance, token })}
            </Text>
            {!isZeroBalance && (
              <Text variant={'small'} color={isPositive ? colors.positive : colors.negative}>
                {isPositive && '+'}
                {changePercentage}
              </Text>
            )}
          </RowContainer>
        </>
      )}
    </Container>
  );
};

export default YourBalanceContent;

const Container = styled.View`
  width: 90%;
`;

const RowContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;
