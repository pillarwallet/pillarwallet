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
import React from 'react';
import styled from 'styled-components/native';
import { useNavigationParam } from 'react-navigation-hooks';
import { isEmpty } from 'lodash';

// Utils
import { useThemeColors } from 'utils/themes';
import { numberWithCommas, convertDecimalNumber } from 'utils/common';
import { fiatTokenValue } from 'utils/rates';
import { getUrlToSymbol } from 'utils/assets';

// Components
import Text from 'components/core/Text';
import Icon from 'components/core/Icon';
import { Spacing } from 'components/legacy/Layout';
import ActivityTokenIcon from 'components/display/ActivityTokenIcon';

// Selectors
import { useRatesPerChain, useFiatCurrency, useSupportedAssetsPerChain } from 'selectors';
import { useSupportedChains } from 'selectors/chains';

// Models
import type { AssetDataNavigationParam } from 'models/Asset';
import type { TredingActivityData, PoolActivityData } from 'models/Exchange';

interface Props {
  data: PoolActivityData | TredingActivityData;
  isTreding?: boolean;
}

const TokenAnalyticsActivityList = ({ data, isTreding }: Props) => {
  const colors = useThemeColors();
  const currency = useFiatCurrency();
  const ratesPerChain = useRatesPerChain();
  const supportedAssets = useSupportedAssetsPerChain();
  const chains = useSupportedChains();

  const assetData: AssetDataNavigationParam = useNavigationParam('assetData');

  const { chain } = assetData;

  if (!data) {
    return null;
  }

  const { tokensOut, tokensIn, timestamp, amountUSD } = data;

  if (isTreding && tokensIn?.[0].amm === 'meshswap') {
    return null;
  }

  const isOut = isTreding ? data?.direction === 'out' : data?.transactionType === 'burn';

  const fiatValue = fiatTokenValue(amountUSD, ratesPerChain[chain], currency);

  const poolActivityDate = new Date(timestamp * 1000);
  const currentDate = new Date();

  const formattedTime = getDateDiff(poolActivityDate, currentDate);

  const tokenA = isTreding ? tokensIn[0] : !isEmpty(tokensIn) ? tokensIn[0] : tokensOut[0];
  const tokenB = isTreding ? tokensOut[0] : !isEmpty(tokensIn) ? tokensIn[1] : tokensOut[1];

  const { amount: firstTokenAmount, symbol: firstTokenSymbol } = tokenA || '';
  const { amount: secondTokenAmount, symbol: secondTokenSymbol } = tokenB || '';

  const firstTokenImageURl = getUrlToSymbol(chain, chains, supportedAssets, firstTokenSymbol);
  const secondTokenImageURl = getUrlToSymbol(chain, chains, supportedAssets, secondTokenSymbol);

  const firstDecimalValue = convertDecimalNumber(firstTokenAmount ?? 0);
  const secondDecimalValue = convertDecimalNumber(secondTokenAmount ?? 0);

  const tredingIconProps = isTreding
    ? {
        leftIconStyle: { top: 0, left: 0 },
        style: { height: 26 * 1.5, justifyContent: 'flex-end' },
      }
    : {};

  const iconName = isTreding ? (isOut ? 'red-down' : 'green-up') : isOut ? 'red-minus' : 'green-plus';

  return (
    <ItemContainer>
      <Icon name={iconName} width={16} height={16} />

      <Spacing w={20} />

      <ActivityTokenIcon
        firstTokenUrl={firstTokenImageURl}
        secondTokenUrl={secondTokenImageURl}
        size={26}
        {...tredingIconProps}
      />

      <Spacing w={24} />

      <SubContent>
        <RowContainer>
          <Text>{fiatValue}</Text>
          <Text variant="regular" color={isOut ? colors.negative : colors.positive}>
            {numberWithCommas(firstDecimalValue)} {firstTokenSymbol}
          </Text>
        </RowContainer>
        <RowContainer>
          <Text variant="small" color={colors.tertiaryText}>
            {formattedTime}
          </Text>
          <Text variant="small" color={isOut ? colors.negative : colors.positive}>
            {numberWithCommas(secondDecimalValue)} {secondTokenSymbol}
          </Text>
        </RowContainer>
      </SubContent>
    </ItemContainer>
  );
};

export default TokenAnalyticsActivityList;

function getDateDiff(startDate, endDate) {
  // For min diff
  const msInMinute = 60 * 1000;
  const minDiff = Math.round(Math.abs(endDate - startDate) / msInMinute);
  if (minDiff < 60) return minDiff + 'min.';

  // For hour diff
  const msInHour = 1000 * 60 * 60;
  const hourDiff = Math.round(Math.abs(endDate.getTime() - startDate.getTime()) / msInHour);
  if (hourDiff < 24) return hourDiff + 'h.';

  // For day diff
  const msInDay = 24 * 60 * 60 * 1000;
  const dayDiff = Math.round(Math.abs(endDate - startDate) / msInDay);
  if (dayDiff < 7) return dayDiff + 'd.';

  // For week diff
  const msInWeek = 1000 * 60 * 60 * 24 * 7;
  const weekDiff = Math.round(Math.abs(endDate - startDate) / msInWeek);
  if (weekDiff < 4) return weekDiff + 'wk.';

  // For month diff
  const monthDiff = endDate.getMonth() - startDate.getMonth() + 12 * (endDate.getFullYear() - startDate.getFullYear());

  return monthDiff + 'mo.';
}

const RowContainer = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

const ItemContainer = styled.View`
  width: 100%;
  height: 60px;
  padding: 8px 20px 9px;
  flex-direction: row;
  align-items: center;
`;

const SubContent = styled.View`
  flex: 1;
`;
