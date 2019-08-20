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
import { FlatList, Platform, View } from 'react-native';
import isEqualWith from 'lodash.isequalwith';
import type { NavigationScreenProp } from 'react-navigation';
import { SDK_PROVIDER } from 'react-native-dotenv';
import { createStructuredSelector } from 'reselect';
import { withNavigation } from 'react-navigation';
import styled from 'styled-components/native';

// components
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { MediumText } from 'components/Typography';

// constants
import { defaultFiatCurrency, TOKENS } from 'constants/assetsConstants';
import { ASSET } from 'constants/navigationConstants';

// utils
import { getAccountAddress } from 'utils/accounts';
import { getBalance, getRate } from 'utils/assets';
import { formatMoney, getCurrencySymbol } from 'utils/common';
import { baseColors, fontSizes, spacing } from 'utils/variables';

// configs
import assetsConfig from 'configs/assetsConfig';

// types
import type { Assets, Balances } from 'models/Asset';
import type { Account } from 'models/Account';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { activeAccountSelector } from 'selectors';
import { paymentNetworkAccountBalancesSelector } from 'selectors/paymentNetwork';

const IS_IOS = Platform.OS === 'ios';

type Props = {
  onHideTokenFromWallet: Function,
  horizontalPadding: Function,
  assets: Assets,
  balances: Balances,
  balance: number,
  rates: Object,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: string,
  assetsLayout: string,
  forceHideRemoval: boolean,
  updateHideRemoval: Function,
  activeAccount: Account,
  paymentNetworkBalances: Balances,
}

const ListHeaderWrapper = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: ${spacing.large}px ${spacing.large}px 0;
  margin-top: 4px;
  margin-bottom: 6px;
`;

const HeaderTitle = styled(MediumText)`
  font-size: ${fontSizes.extraSmall}px;
  color: ${baseColors.blueYonder};
`;

class AssetsList extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    const isEq = isEqualWith(this.props, nextProps, (val1, val2) => {
      if (typeof val1 === 'function' && typeof val2 === 'function') return true;
      return undefined;
    });
    return !isEq;
  }

  renderHeader = () => {
    const { balance, baseFiatCurrency } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const walletBalance = formatMoney(balance || 0);
    const currencySymbol = getCurrencySymbol(fiatCurrency);

    return (
      <ListHeaderWrapper>
        <HeaderTitle>{`Wallet balance ${currencySymbol} ${walletBalance}`}</HeaderTitle>
      </ListHeaderWrapper>
    );
  };

  renderToken = ({ item: asset }) => {
    const {
      activeAccount,
      baseFiatCurrency,
      navigation,
    } = this.props;

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    const {
      name,
      symbol,
      balanceInFiat,
      balance,
      iconMonoUrl,
      wallpaperUrl,
      decimals,
      iconUrl,
      patternUrl,
      paymentNetworkBalance,
      paymentNetworkBalanceInFiat,
    } = asset;

    const fullIconMonoUrl = iconMonoUrl ? `${SDK_PROVIDER}/${iconMonoUrl}?size=2` : '';
    const fullIconWallpaperUrl = `${SDK_PROVIDER}/${wallpaperUrl}${IS_IOS ? '?size=3' : ''}`;
    const fullIconUrl = iconUrl ? `${SDK_PROVIDER}/${iconUrl}?size=3` : '';
    const patternIcon = patternUrl ? `${SDK_PROVIDER}/${patternUrl}?size=3` : fullIconUrl;
    const formattedBalanceInFiat = formatMoney(balanceInFiat);
    const displayAmount = formatMoney(balance, 4);
    const currencySymbol = getCurrencySymbol(fiatCurrency);

    const {
      listed: isListed = true,
      disclaimer,
    } = assetsConfig[symbol] || {};

    const props = {
      id: symbol,
      name: name || symbol,
      token: symbol,
      amount: displayAmount,
      balance,
      balanceInFiat: { amount: formattedBalanceInFiat, currency: fiatCurrency },
      address: getAccountAddress(activeAccount),
      contractAddress: asset.address,
      icon: fullIconMonoUrl,
      wallpaper: fullIconWallpaperUrl,
      iconColor: fullIconUrl,
      isListed,
      disclaimer,
      paymentNetworkBalance,
      paymentNetworkBalanceFormatted: formatMoney(paymentNetworkBalance, 4),
      paymentNetworkBalanceInFiat: formatMoney(paymentNetworkBalanceInFiat),
      patternIcon,
      description: asset.description,
      decimals,
    };
    return (
      <ListItemWithImage
        onPress={() => {
          navigation.navigate(ASSET,
            {
              assetData: {
                ...props,
                tokenType: TOKENS,
              },
            },
          );
        }}
        label={name}
        avatarUrl={fullIconUrl}
        balance={{
          balance: formatMoney(balance),
          value: formatMoney(balanceInFiat, 2),
          currency: currencySymbol,
          token: symbol,
        }}
      />
    );
  };

  renderSeparator = () => {
    return (
      <View
        style={{
          marginTop: -8,
          height: 0,
          width: '100%',
          backgroundColor: 'transparent',
        }}
      />
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
      <FlatList
        data={sortedAssets}
        keyExtractor={(item) => item.id}
        renderItem={this.renderToken}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        onEndReachedThreshold={0.5}
        style={{ width: '100%', height: '100%', flex: 1 }}
        ListHeaderComponent={this.renderHeader}
        conentContainerStyle={{ paddingTop: 4 }}
      />
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

export default withNavigation(connect(combinedMapStateToProps)(AssetsList));
