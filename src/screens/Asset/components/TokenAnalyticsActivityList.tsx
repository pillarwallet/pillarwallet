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
import { numberWithCommas, convertDecimalNumber, getDateDiff } from 'utils/common';
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
import type { TradingActivityData, PoolActivityData } from 'models/Exchange';

interface TokenAnalyticsActivityListProps {
  data: PoolActivityData | TradingActivityData;
  isTrading?: boolean;
}

const TokenAnalyticsActivityList = ({ data, isTrading }: TokenAnalyticsActivityListProps) => {
  const colors = useThemeColors();
  const currency = useFiatCurrency();
  const ratesPerChain = useRatesPerChain();
  const supportedAssets = useSupportedAssetsPerChain();
  const chains = useSupportedChains();

  const assetData: AssetDataNavigationParam = useNavigationParam('assetData');

  const { chain } = assetData;

  if (isEmpty(data)) {
    return null;
  }

  const { tokensOut, tokensIn, timestamp, amountUSD } = data;

  const tokenA = isTrading ? tokensIn[0] : !isEmpty(tokensIn) ? tokensIn[0] : tokensOut[0];
  const tokenB = isTrading ? tokensOut[0] : !isEmpty(tokensIn) ? tokensIn[1] : tokensOut[1];

  if (!tokenA || !tokenB) {
    return null;
  }

  const isOut = isTrading ? data?.direction === 'in' : data?.transactionType === 'mint';

  const fiatValue = fiatTokenValue(amountUSD, ratesPerChain[chain], currency);

  const poolActivityDate = new Date(timestamp * 1000);
  const currentDate = new Date();

  const formattedTime = getDateDiff(poolActivityDate, currentDate);

  const { amount: firstTokenAmount, symbol: firstTokenSymbol } = tokenA || '';
  const { amount: secondTokenAmount, symbol: secondTokenSymbol } = tokenB || '';

  const firstTokenImageURl = getUrlToSymbol(chain, chains, supportedAssets, firstTokenSymbol);
  const secondTokenImageURl = getUrlToSymbol(chain, chains, supportedAssets, secondTokenSymbol);

  const firstDecimalValue = convertDecimalNumber(firstTokenAmount ?? 0);
  const secondDecimalValue = convertDecimalNumber(secondTokenAmount ?? 0);

  const tradingIconProps = isTrading
    ? {
        leftIconStyle: { top: 0, left: 0 },
        style: { height: 26 * 1.5, justifyContent: 'flex-end' },
      }
    : {};

  const iconName = isTrading ? (isOut ? 'red-down' : 'green-up') : isOut ? 'red-minus' : 'green-plus';

  return (
    <ItemContainer>
      <Icon name={iconName} width={16} height={16} />

      <Spacing w={20} />

      <ActivityTokenIcon
        firstTokenUrl={firstTokenImageURl}
        secondTokenUrl={secondTokenImageURl}
        size={26}
        {...tradingIconProps}
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
