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
import { Alert, FlatList, Platform, View } from 'react-native';
import isEqualWith from 'lodash.isequalwith';
import isEqual from 'lodash.isequal';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';
import { createStructuredSelector } from 'reselect';
import { withNavigation } from 'react-navigation';
import styled, { withTheme } from 'styled-components/native';
import Swipeout from 'react-native-swipeout';
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';

// components
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { MediumText } from 'components/Typography';
import Toast from 'components/Toast';
import SwipeoutButton from 'components/SwipeoutButton';

// constants
import { defaultFiatCurrency, TOKENS, ETH, PLR } from 'constants/assetsConstants';
import { ASSET } from 'constants/navigationConstants';

// actions
import { hideAssetAction } from 'actions/userSettingsActions';

// utils
import { getAccountAddress } from 'utils/accounts';
import { getBalance, getRate } from 'utils/assets';
import { formatMoney, formatFiat, formatAmount } from 'utils/common';
import { fontStyles, spacing } from 'utils/variables';
import { getThemeColors } from 'utils/themes';

// configs
import assetsConfig from 'configs/assetsConfig';

// types
import type { Asset, Assets, Balances } from 'models/Asset';
import type { Account } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { activeAccountSelector } from 'selectors';
import { paymentNetworkAccountBalancesSelector } from 'selectors/paymentNetwork';
import { accountAssetsSelector } from 'selectors/assets';


const IS_IOS = Platform.OS === 'ios';

type Props = {
  onHideTokenFromWallet: Function,
  horizontalPadding: Function,
  assets: Assets,
  balances: Balances,
  balance: number,
  rates: Object,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: ?string,
  assetsLayout: string,
  activeAccount: ?Account,
  paymentNetworkBalances: Balances,
  hideAsset: Function,
  scrollViewRef?: Object,
  theme: Theme,
  sessionLanguageCode: ?string, // important for re-rendering on language change
};

type State = {
  forceHideRemoval: boolean,
};

const ListHeaderWrapper = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: ${spacing.medium}px ${spacing.large}px 0;
  margin-bottom: 6px;
`;

const HeaderTitle = styled(MediumText)`
  ${fontStyles.big};
`;


class AssetsList extends React.Component<Props, State> {
  didBlur: NavigationEventSubscription;
  willFocus: NavigationEventSubscription;

  state = {
    forceHideRemoval: false,
  };

  componentDidMount() {
    const { navigation } = this.props;
    this.willFocus = navigation.addListener(
      'willFocus',
      () => { this.setState({ forceHideRemoval: false }); },
    );

    this.didBlur = navigation.addListener(
      'didBlur',
      () => { this.setState({ forceHideRemoval: true }); },
    );
  }

  componentWillUnmount() {
    this.didBlur.remove();
    this.willFocus.remove();
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isEq = isEqualWith(this.props, nextProps, (val1, val2) => {
      if (typeof val1 === 'function' && typeof val2 === 'function') return true;
      return undefined;
    }) && isEqual(this.state, nextState);
    return !isEq;
  }

  renderHeader = () => {
    const { balance, baseFiatCurrency } = this.props;
    const walletBalance = formatFiat(balance || 0, baseFiatCurrency);

    return (
      <ListHeaderWrapper>
        <HeaderTitle>{t('label.walletBalance', { balance: walletBalance })}</HeaderTitle>
      </ListHeaderWrapper>
    );
  };

  hideAsset = (asset) => {
    const { hideAsset } = this.props;
    Alert.alert(
      t('alert.hideAsset.title'),
      t('alert.hideAsset.message', { asset: asset.name }),
      [
        {
          text: t('alert.hideAsset.button.cancel'),
          onPress: () => this.setState({ forceHideRemoval: true }),
          style: 'cancel',
        },
        { text: t('alert.hideAsset.button.ok'), onPress: () => hideAsset(asset) },
      ],
    );
  };

  showNotRemovedToast = (asset) => {
    Toast.show({
      message: t('toast.forbiddenToRemoveAsset', { assetName: asset.name, assetSymbol: asset.symbol }),
      emoji: 'point_up',
    });
    this.setState({ forceHideRemoval: true });
  };

  renderToken = ({ item: asset }) => {
    const { forceHideRemoval } = this.state;
    const {
      activeAccount,
      baseFiatCurrency,
      navigation,
      scrollViewRef,
      theme,
    } = this.props;

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

    const colors = getThemeColors(theme);
    const fullIconMonoUrl = iconMonoUrl ? `${getEnv().SDK_PROVIDER}/${iconMonoUrl}?size=2` : '';
    const fullIconWallpaperUrl = `${getEnv().SDK_PROVIDER}/${wallpaperUrl}${IS_IOS ? '?size=3' : ''}`;
    const fullIconUrl = iconUrl ? `${getEnv().SDK_PROVIDER}/${iconUrl}?size=3` : '';
    const patternIcon = patternUrl ? `${getEnv().SDK_PROVIDER}/${patternUrl}?size=3` : fullIconUrl;
    const formattedBalanceInFiat = formatFiat(balanceInFiat, baseFiatCurrency);
    const displayAmount = formatMoney(balance, 4);

    const {
      listed: isListed = true,
      disclaimer,
    } = assetsConfig[symbol] || {};

    const disableRemove = symbol === ETH || symbol === PLR;

    const props = {
      id: symbol,
      name: name || symbol,
      token: symbol,
      amount: displayAmount,
      balance,
      balanceInFiat: formattedBalanceInFiat,
      address: activeAccount && getAccountAddress(activeAccount),
      contractAddress: asset.address,
      icon: fullIconMonoUrl,
      wallpaper: fullIconWallpaperUrl,
      iconColor: fullIconUrl,
      isListed,
      disclaimer,
      paymentNetworkBalance,
      paymentNetworkBalanceFormatted: formatMoney(paymentNetworkBalance, 4),
      paymentNetworkBalanceInFiat: formatFiat(paymentNetworkBalanceInFiat, baseFiatCurrency),
      patternIcon,
      description: asset.description,
      decimals,
    };
    return (
      <Swipeout
        right={[{
          component: (
            <SwipeoutButton
              onPress={() => disableRemove ? this.showNotRemovedToast(asset) : this.hideAsset(asset)}
              iconName="turn-off"
              color={colors.negative}
              label={t('button.hide')}
              disabled={disableRemove}
            />
          ),
        }]}
        backgroundColor="transparent"
        sensitivity={10}
        close={forceHideRemoval}
        buttonWidth={80}
        onOpen={() => this.setState({ forceHideRemoval: false })}
        scroll={(shouldAllowScroll) => {
          if (scrollViewRef) scrollViewRef.setNativeProps({ scrollEnabled: shouldAllowScroll });
        }}
      >
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
          address={props.address}
          label={name}
          avatarUrl={fullIconUrl}
          balance={{
            balance: formatAmount(balance),
            value: formattedBalanceInFiat,
            token: symbol,
          }}
          fallbackToGenericToken
        />
      </Swipeout>
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
      .map(({ symbol, ...rest }) => ({
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
        contentContainerStyle={{ paddingTop: 4 }}
        scrollEnabled={false}
      />
    );
  }
}

const mapStateToProps = ({
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency, appearanceSettings: { assetsLayout } } },
  session: { data: { sessionLanguageCode } },
}: RootReducerState): $Shape<Props> => ({
  rates,
  baseFiatCurrency,
  assetsLayout,
  sessionLanguageCode,
});

const structuredSelector = createStructuredSelector({
  balances: accountBalancesSelector,
  paymentNetworkBalances: paymentNetworkAccountBalancesSelector,
  activeAccount: activeAccountSelector,
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  hideAsset: (asset: Asset) => dispatch(hideAssetAction(asset)),
});

export default withNavigation(withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(AssetsList)));
