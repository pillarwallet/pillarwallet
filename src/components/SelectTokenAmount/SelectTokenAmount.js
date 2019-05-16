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
import * as React from 'react';
import { Wrapper } from 'components/Layout';
import styled from 'styled-components/native';
import { Text } from 'react-native';
import { UIColors } from 'utils/variables';
import { formatMoney, getCurrencySymbol } from 'utils/common';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import SelectToken from 'components/SelectToken';
import { getRate } from 'utils/assets';

import type { AssetsList, Rates } from 'models/Asset';

const Container = styled(Wrapper)`
  border: 0;
  display: flex;
  flex-direction: row;
`;

const AmountContainer = styled(Wrapper)`
  align-items: center;
  background-color: ${UIColors.defaultInputBackgroundColor};
  border: 1px solid ${UIColors.defaultDividerColor};
  border-left-width: 0;
  display: flex;
  flex: 1;
  flex-direction: row;
  padding: 0 14px;
`;

const ConvertedAmount = styled(Text)`
  color: ${UIColors.disabled};
  font-size: 10px;
`;

const AmountInput = styled.TextInput`
  background-color: ${UIColors.defaultInputBackgroundColor};
  border: 0;
  color: ${UIColors.defaultTextColor};
  display: flex;
  flex: 1;
  font-size: 28px;
  font-weight: bold;
  height: 40px;
  margin: 0 14px;
  padding: 0;
  text-align: right;
`;

type Props = {
  assets: AssetsList,
  rates: Rates,
  baseFiatCurrency: string,
  selectedAmount: string,
  selectedToken: string,
  onTokenChange: (token: string) => void,
  onAmountChange: (amount: string) => void,
};

const cleanupAmount = (value: string) => {
  return value.replace(/[^0-9.]/g, '');
};

const SelectTokenAmount = (props: Props) => {
  const {
    assets,
    rates,
    selectedToken,
    selectedAmount,
    baseFiatCurrency,
    onTokenChange,
    onAmountChange,
  } = props;

  const tokenAmount = parseFloat(selectedAmount) || 0;
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const fiatAmount = tokenAmount * getRate(rates, selectedToken, fiatCurrency);
  const formattedFiatAmount = formatMoney(fiatAmount);
  const currencySymbol = getCurrencySymbol(fiatCurrency);

  return (
    <Container>
      <SelectToken
        assets={assets}
        selectedToken={selectedToken}
        onTokenChange={(value) => onTokenChange(value)}
      />

      <AmountContainer>
        <ConvertedAmount>{currencySymbol}{formattedFiatAmount}</ConvertedAmount>

        <AmountInput
          keyboardType="numeric"
          value={selectedAmount}
          underlineColorAndroid="transparent"
          autoCorrect={false}
          onChangeText={(value: string) => onAmountChange(cleanupAmount(value))}
        />
      </AmountContainer>
    </Container>
  );
};

export default SelectTokenAmount;
