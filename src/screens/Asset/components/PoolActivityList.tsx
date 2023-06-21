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
import PoolTokenIcon from 'components/display/PoolTokenIcon';

// Selectors
import { useRatesPerChain, useFiatCurrency, useSupportedAssetsPerChain } from 'selectors';
import { useSupportedChains } from 'selectors/chains';

// Models
import type { AssetDataNavigationParam } from 'models/Asset';

interface Props {
  data: PoolActivityData;
}

type PoolActivityData = {
  amm: string;
  amountUSD: number;
  timestamp: number;
  tokensIn: PoolsActivityTokensInOut[];
  tokensOut: PoolsActivityTokensInOut[];
  transactionAddress: string;
  transactionType: string;
};

type PoolsActivityTokensInOut = {
  amm: string;
  amount: number;
  network: string;
  priceETH: number;
  priceUSD: number;
  symbol: string;
};

const PoolActivityList = ({ data }: Props) => {
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

  const poolActivityDate = new Date(timestamp * 1000);
  const currentDate = new Date();

  const formattedTime = getDateDiff(poolActivityDate, currentDate);

  const renderItem = (tokens, isPoolOut) => {
    const tokenA = tokens[0];
    const tokenB = tokens[1];

    const { amount: firstTokenAmount, symbol: firstTokenSymbol } = tokenA;
    const { amount: secondTokenAmount, symbol: secondTokenSymbol } = tokenB;

    const firstTokenImageURl = getUrlToSymbol(chain, chains, supportedAssets, firstTokenSymbol);
    const secondTokenImageURl = getUrlToSymbol(chain, chains, supportedAssets, secondTokenSymbol);

    const firstDecimalValue = convertDecimalNumber(firstTokenAmount);
    const secondDecimalValue = convertDecimalNumber(secondTokenAmount);

    const fiatValue = fiatTokenValue(amountUSD, ratesPerChain[chain], currency);

    return (
      <ItemContainer>
        <Icon name={isPoolOut ? 'red-minus' : 'green-plus'} width={16} height={16} />

        <Spacing w={20} />

        <PoolTokenIcon firstTokenUrl={firstTokenImageURl} secondTokenUrl={secondTokenImageURl} size={26} />

        <Spacing w={24} />

        <SubContent>
          <RowContainer>
            <Text>{fiatValue}</Text>
            <Text variant="regular" color={isPoolOut ? colors.negative : colors.positive}>
              {numberWithCommas(firstDecimalValue)} {firstTokenSymbol}
            </Text>
          </RowContainer>
          <RowContainer>
            <Text variant="small" color={colors.tertiaryText}>
              {formattedTime}
            </Text>
            <Text variant="small" color={isPoolOut ? colors.negative : colors.positive}>
              {numberWithCommas(secondDecimalValue)} {secondTokenSymbol}
            </Text>
          </RowContainer>
        </SubContent>
      </ItemContainer>
    );
  };

  return (
    <>
      {!isEmpty(tokensOut) && renderItem(tokensOut, true)}
      {!isEmpty(tokensIn) && renderItem(tokensIn, false)}
    </>
  );
};

export default PoolActivityList;

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
