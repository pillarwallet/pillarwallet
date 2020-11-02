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
import styled from 'styled-components/native';

import { MediumText } from 'components/Typography';
import { formatMoney, getCurrencySymbol } from 'utils/common';
import { defaultFiatCurrency } from 'constants/assetsConstants';


type Props = {
  balance: number,
  fiatCurrency: string,
  label?: string,
  style?: Object,
};


const BalanceText = styled(MediumText)`
  font-size: 36px;
  line-height: 36px;
`;

const CurrencyText = styled(MediumText)`
  font-size: 20px;
  line-height: 20px;
  margin-top: 2px;
  margin-right: 6px;
`;

const BalanceWrapper = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: flex-start;
`;


class BalanceView extends React.PureComponent<Props> {
  render() {
    const { style, fiatCurrency, balance } = this.props;

    const portfolioBalance = formatMoney(balance, 2, 3, ',', '.', false);
    const currency = fiatCurrency || defaultFiatCurrency;
    const currencySymbol = getCurrencySymbol(currency);

    return (
      <BalanceWrapper style={style}>
        <CurrencyText>{currencySymbol}</CurrencyText>
        <BalanceText>{portfolioBalance}</BalanceText>
      </BalanceWrapper>
    );
  }
}

export default BalanceView;
