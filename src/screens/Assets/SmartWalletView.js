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
import { RefreshControl } from 'react-native';
import styled from 'styled-components/native';
import { SDK_PROVIDER } from 'react-native-dotenv';
import { createStructuredSelector } from 'reselect';

import { Wrapper } from 'components/Layout';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { MediumText } from 'components/Typography';

import { getBalance, getRate } from 'utils/assets';
import { formatMoney, getCurrencySymbol } from 'utils/common';
import { baseColors, fontSizes, spacing } from 'utils/variables';

import { defaultFiatCurrency } from 'constants/assetsConstants';

import { activeAccountSelector } from 'selectors';
import { paymentNetworkAccountBalancesSelector } from 'selectors/paymentNetwork';
import { accountBalancesSelector } from 'selectors/balances';
import type { Assets, Balances } from 'models/Asset';

type Props = {
  baseFiatCurrency: string,
  assets: Assets,
  rates: Object,
  balances: Balances,
  paymentNetworkBalances: Balances,
}

const ListHeaderWrapper = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: ${spacing.large}px;
`;

const HeaderTitle = styled(MediumText)`
  font-size: ${fontSizes.extraSmall}px;
  color: ${baseColors.blueYonder};
`;

const StyledFlatList = styled.FlatList`
  background-color: ${baseColors.white};
  border-top-color: ${baseColors.mediumLightGray};
  border-top-width: 1px;
`;

class SmartWalletView extends React.Component<Props> {
  renderAsset = ({ item: asset }) => {
    const { baseFiatCurrency } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const currencySymbol = getCurrencySymbol(fiatCurrency);

    const {
      name,
      symbol,
      iconUrl,
      paymentNetworkBalance,
      paymentNetworkBalanceInFiat,
    } = asset;

    const fullIconUrl = iconUrl ? `${SDK_PROVIDER}/${iconUrl}?size=3` : '';

    return (
      <ListItemWithImage
        onPress={() => {}}
        label={name}
        avatarUrl={fullIconUrl}
        balance={{
          syntheticBalance: formatMoney(paymentNetworkBalance),
          value: formatMoney(paymentNetworkBalanceInFiat, 4),
          currency: currencySymbol,
          token: symbol,
        }}
      />
    );
  };

  renderHeader = () => {
    return (
      <ListHeaderWrapper>
        <HeaderTitle>Wallet balance £168.71</HeaderTitle>
      </ListHeaderWrapper>
    );
  };

  render() {
    const {
      assets,
      baseFiatCurrency,
      rates,
      balances,
      paymentNetworkBalances,
    } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    const sortedAssets = Object.keys(assets)
      .map(id => assets[id])
      .map(({ symbol, balance, ...rest }) => ({
        symbol,
        balance: getBalance(balances, symbol),
        paymentNetworkBalance: getBalance(paymentNetworkBalances, symbol),
        ...rest,
      }))
      .map(({ balance, symbol, paymentNetworkBalance, ...rest }) => ({ // eslint-disable-line
        balance,
        symbol,
        balanceInFiat: balance * getRate(rates, symbol, fiatCurrency),
        paymentNetworkBalance,
        paymentNetworkBalanceInFiat: paymentNetworkBalance * getRate(rates, symbol, fiatCurrency),
        ...rest,
      }))
      .sort((a, b) => b.balanceInFiat - a.balanceInFiat);

    return (
      <Wrapper>
        <StyledFlatList
          data={sortedAssets}
          keyExtractor={(item) => item.id}
          renderItem={this.renderAsset}
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          onEndReachedThreshold={0.5}
          style={{ width: '100%', height: '100%' }}
          ListHeaderComponent={this.renderHeader}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {}}
            />
          }
        />
      </Wrapper>
    );
  }
}

const mapStateToProps = ({
  assets: { data: assets },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency, appearanceSettings: { assetsLayout } } },
}) => ({
  assets,
  rates,
  baseFiatCurrency,
  assetsLayout,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  paymentNetworkBalances: paymentNetworkAccountBalancesSelector,
  activeAccount: activeAccountSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

export default connect(combinedMapStateToProps)(SmartWalletView);
