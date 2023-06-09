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

// Utils
import { useThemeColors } from 'utils/themes';
import { getCurrencySymbol } from 'utils/common';
import { poolsTokenValue, fiatTokenValue } from 'utils/rates';
import { useChainConfig } from 'utils/uiConfig';

// Components
import Text from 'components/core/Text';
import Icon from 'components/core/Icon';
import { Spacing } from 'components/legacy/Layout';
import PoolTokenIcon from 'components/display/PoolTokenIcon';

// Selectors
import { useRatesPerChain, useFiatCurrency } from 'selectors';

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

  const currencySymbol = getCurrencySymbol(currency);
  const ratesPerChain = useRatesPerChain();

  const assetData: AssetDataNavigationParam = useNavigationParam('assetData');

  const { chain, contractAddress, imageUrl, token } = assetData;

  const chainConfig = useChainConfig(chain);

  if (!data) {
    return null;
  }

  const { tokensOut, tokensIn, timestamp } = data;

  const poolActivityDate = new Date(timestamp * 1000);
  const currentDate = new Date();

  const formattedDate = getDateDiff(poolActivityDate, currentDate);

  const renderItem = (item, index, isPoolOut) => {
    const fiatValue = fiatTokenValue(item?.priceUSD, ratesPerChain[chain], currency);

    const { nativeValue, tokenValue } = poolsTokenValue(chain, contractAddress, item.priceUSD, ratesPerChain);

    return (
      <ItemContainer key={index.toString()}>
        <Icon name={isPoolOut ? 'red-minus' : 'green-plus'} width={16} height={16} />

        <Spacing w={20} />

        <PoolTokenIcon url={imageUrl} chain={chain} size={26} />

        <Spacing w={24} />

        <SubContent>
          <RowContainer>
            <Text>{fiatValue}</Text>
            {nativeValue && (
              <Text variant="regular" color={isPoolOut ? colors.negative : colors.positive}>
                {nativeValue} {chainConfig.gasSymbol}
              </Text>
            )}
          </RowContainer>
          <RowContainer>
            <Text variant="small" color={colors.tertiaryText}>
              {formattedDate}
            </Text>
            {tokenValue && (
              <Text variant="small" color={isPoolOut ? colors.negative : colors.positive}>
                {tokenValue} {token}
              </Text>
            )}
          </RowContainer>
        </SubContent>
      </ItemContainer>
    );
  };

  return (
    <>
      {tokensOut?.map((item, index) => renderItem(item, index, true))}
      {tokensIn?.map((item, index) => renderItem(item, index, false))}
    </>
  );
};

export default PoolActivityList;

function getDateDiff(startDate, endDate) {
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
