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
import { poolsTokenValue, fiatTokenValue } from 'utils/rates';
import { useChainConfig } from 'utils/uiConfig';

// Components
import Text from 'components/core/Text';
import Icon from 'components/core/Icon';
import { Spacing } from 'components/legacy/Layout';
import TradingTokenIcon from 'components/display/TradingTokenIcon';

// Selectors
import { useRatesPerChain, useFiatCurrency } from 'selectors';

// Models
import type { AssetDataNavigationParam } from 'models/Asset';
import type { ActivityData } from 'models/Exchange';

interface Props {
  data: ActivityData;
}

const TradingActivityList = ({ data }: Props) => {
  const colors = useThemeColors();
  const currency = useFiatCurrency();

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

  const renderItem = (item, index, isTradingOut) => {
    const fiatValue = fiatTokenValue(item?.priceUSD, ratesPerChain[chain], currency);

    const { nativeValue, tokenValue } = poolsTokenValue(chain, contractAddress, item.priceUSD, ratesPerChain);

    return (
      <ItemContainer key={index.toString()}>
        <Icon name={isTradingOut ? 'red-down' : 'green-up'} width={16} height={16} />

        <Spacing w={20} />

        <TradingTokenIcon url={imageUrl} chain={chain} size={26} />

        <Spacing w={24} />

        <SubContent>
          <RowContainer>
            <Text>{fiatValue}</Text>
            {nativeValue && (
              <Text variant="regular" color={isTradingOut ? colors.negative : colors.positive}>
                {nativeValue} {chainConfig.gasSymbol}
              </Text>
            )}
          </RowContainer>
          <RowContainer>
            <Text variant="small" color={colors.tertiaryText}>
              {formattedDate}
            </Text>
            {tokenValue && (
              <Text variant="small" color={isTradingOut ? colors.negative : colors.positive}>
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

export default TradingActivityList;

function getDateDiff(startDate, endDate) {
  // For min diff
  const msInMinute = 60 * 1000;
  const minDiff = Math.round(Math.abs(endDate - startDate) / msInMinute);
  if (minDiff < 60) return minDiff + 'min.';

  // For hour diff
  const msInHour = 1000 * 60 * 60;
  const hourDiff = Math.round(Math.abs(endDate.getTime() - startDate.getTime()) / msInHour);
  return hourDiff + 'h.';
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
