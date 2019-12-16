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
import { connect } from 'react-redux';
import { View } from 'react-native';
import styled from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import type {
  Balances,
  Rates,
} from 'models/Asset';
import { BaseText } from 'components/Typography';
import { calculateBalanceInFiat } from 'utils/assets';
import { formatFiat } from 'utils/common';
import { fontSizes } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { defaultFiatCurrency } from 'constants/assetsConstants';
import { accountBalancesSelector } from 'selectors/balances';
import { accountAssetsSelector } from 'selectors/assets';

type Props = {
  rates: Rates,
  balances: Balances,
  baseFiatCurrency: string,
  label?: string,
  style: Object,
};

const LabelText = styled(BaseText)`
  color: ${themedColors.secondaryText};
  font-size: ${fontSizes.medium}px;
  padding: 10px 0;
`;

const BalanceText = styled(BaseText)`
  color: ${themedColors.text};
  font-size: ${fontSizes.giant}px;
`;

class PortfolioBalance extends React.PureComponent<Props> {
  render() {
    const {
      style,
      rates,
      balances,
      baseFiatCurrency,
      label,
    } = this.props;

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const balance = calculateBalanceInFiat(rates, balances, fiatCurrency);
    const portfolioBalance = formatFiat(balance, baseFiatCurrency);

    return (
      <View style={style}>
        {!!label && <LabelText>{label}</LabelText>}
        <BalanceText>{portfolioBalance}</BalanceText>
      </View>
    );
  }
}

const mapStateToProps = ({
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  rates,
  baseFiatCurrency,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(PortfolioBalance);
