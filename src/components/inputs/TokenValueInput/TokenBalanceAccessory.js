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

import * as React from 'react';
import { Keyboard, TouchableOpacity } from 'react-native';
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import t from 'translations/translate';

// Components
import Text from 'components/core/Text';

// Selectors
import { useChainRates, useFiatCurrency } from 'selectors';

// Utils
import { hitSlop10 } from 'utils/common';
import { formatTokenValue, formatFiatValue } from 'utils/format';
import { getAssetValueInFiat } from 'utils/rates';
import { spacing } from 'utils/variables';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { Asset } from 'models/Asset';
import type { Chain } from 'models/Chain';
import type { RatesByAssetAddress, Currency } from 'models/Rates';

type Props = {|
  chain: ?Chain,
  asset: ?Asset,
  balance?: ?BigNumber,
  onUseMax?: () => mixed,
  disableUseMax?: boolean, // Disable use max
  useMaxTitle?: string,
  style?: ViewStyleProp,
|};

/**
 * Control allowing specifying token value in both token and/or fiat terms.
 */
const TokenBalanceAccessory = ({
  chain,
  asset,
  balance,
  onUseMax,
  disableUseMax,
  useMaxTitle,
  style,
}: Props) => {
  const rates = useChainRates(chain);
  const currency = useFiatCurrency();

  const handleUseMax = () => {
    Keyboard.dismiss();
    onUseMax?.();
  };

  if (!balance || BigNumber(balance).lte(0)) return null;

  const formattedBalance = formatBalance(balance, asset, rates, currency);

  return (
    <Container style={style}>
      <Balance>{formattedBalance}</Balance>

      {!disableUseMax && (
        <TouchableOpacity hitSlop={hitSlop10} onPress={handleUseMax}>
          <TextButtonTitle>{useMaxTitle ?? t('button.useMax')}</TextButtonTitle>
        </TouchableOpacity>
      )}
    </Container>
  );
};

export default TokenBalanceAccessory;

function formatBalance(balance: ?BigNumber, asset: ?Asset, rates: RatesByAssetAddress, currency: Currency) {
  const balanceInFiat = getAssetValueInFiat(balance, asset?.address, rates, currency);

  const formattedBalance = formatTokenValue(balance, asset?.symbol);
  const formattedBalanceInFiat = formatFiatValue(balanceInFiat, currency);

  if (formattedBalanceInFiat) {
    return t('label.balanceFiatTokenFormat', { balance: formattedBalance, balanceInFiat: formattedBalanceInFiat });
  }

  if (formattedBalance) {
    return t('label.balanceTokenFormat', { balance: formattedBalance });
  }

  return null;
}

const Container = styled.View`
  flex-direction: row;
`;

const Balance = styled(Text)`
  flex: 1;
  color: ${({ theme }) => theme.colors.secondaryText};
`;

const TextButtonTitle = styled(Text)`
  margin-left: ${spacing.medium}px;
  color: ${({ theme }) => theme.colors.link};
`;
