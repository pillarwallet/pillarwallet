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
import {
  RefreshControl,
  FlatList,
  Platform,
  View,
} from 'react-native';
import isEqualWith from 'lodash.isequalwith';
import type { NavigationScreenProp } from 'react-navigation';
import { SDK_PROVIDER } from 'react-native-dotenv';
import Swipeout from 'react-native-swipeout';
import { createStructuredSelector } from 'reselect';

// components
import AssetCardMinimized from 'components/AssetCard/AssetCardMinimized';
import AssetCardSimplified from 'components/AssetCard/AssetCardSimplified';

// actions
import { fetchAssetsBalancesAction } from 'actions/assetsActions';

// constants
import { defaultFiatCurrency, ETH, TOKENS } from 'constants/assetsConstants';
import { EXPANDED, EXTRASMALL, MINIMIZED, SIMPLIFIED } from 'constants/assetsLayoutConstants';
import { ASSET } from 'constants/navigationConstants';

// utils
import { getAccountAddress } from 'utils/accounts';
import { getBalance, getRate } from 'utils/assets';
import { formatMoney, smallScreen } from 'utils/common';

// configs
import assetsConfig from 'configs/assetsConfig';

// types
import type { Assets, Balances } from 'models/Asset';
import type { Account } from 'models/Account';

// selectors
import { accountBalancesSelector } from 'selectors/balances';
import { activeAccountSelector } from 'selectors';

// local components
import HideAssetButton from './HideAssetButton';


const IS_IOS = Platform.OS === 'ios';

type Props = {
  fetchAssetsBalances: (assets: Assets) => Function,
  onHideTokenFromWallet: Function,
  horizontalPadding: Function,
  assets: Assets,
  balances: Balances,
  rates: Object,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: string,
  assetsLayout: string,
  forceHideRemoval: boolean,
  updateHideRemoval: Function,
  activeAccount: Account,
}

class AssetsList extends React.Component<Props> {
  shouldComponentUpdate(nextProps: Props) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqualWith(this.props, nextProps, (val1, val2) => {
      if (typeof val1 === 'function' && typeof val2 === 'function') return true;
      return undefined;
    });
    return !isEq;
  }

  renderSwipeoutButtons = (asset) => {
    // const { assetsLayout } = this.props;
    // const isExpanded = assetsLayout === EXPANDED;
    const { onHideTokenFromWallet } = this.props;
    const isETH = asset.symbol === ETH;
    return [{
      component: (
        <HideAssetButton
          // expanded={isExpanded}
          onPress={onHideTokenFromWallet(asset)}
          disabled={isETH}
        />),
      backgroundColor: 'transparent',
      disabled: true,
    }];
  };

  resetHideRemoval = () => {
    this.props.updateHideRemoval(false);
  };

  handleCardTap = (assetData: Object) => {
    const { navigation, updateHideRemoval } = this.props;
    updateHideRemoval(true);
    navigation.navigate(ASSET,
      {
        assetData: {
          ...assetData,
          tokenType: TOKENS,
        },
        resetHideRemoval: this.resetHideRemoval,
      },
    );
  };

  renderToken = ({ item: asset }) => {
    const {
      activeAccount,
      baseFiatCurrency,
      assetsLayout,
      onHideTokenFromWallet,
      forceHideRemoval,
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
    } = asset;

    const fullIconMonoUrl = iconMonoUrl ? `${SDK_PROVIDER}/${iconMonoUrl}?size=2` : '';
    const fullIconWallpaperUrl = `${SDK_PROVIDER}/${wallpaperUrl}${IS_IOS ? '?size=3' : ''}`;
    const fullIconUrl = iconUrl ? `${SDK_PROVIDER}/${iconUrl}?size=3` : '';
    const formattedBalanceInFiat = formatMoney(balanceInFiat);
    const displayAmount = formatMoney(balance, 4);

    const assetData = {
      name: name || symbol,
      token: symbol,
      amount: displayAmount,
      contractAddress: asset.address,
      description: asset.description,
      balance,
      balanceInFiat: { amount: formattedBalanceInFiat, currency: fiatCurrency },
      address: getAccountAddress(activeAccount),
      icon: fullIconMonoUrl,
      iconColor: fullIconUrl,
      wallpaper: fullIconWallpaperUrl,
      decimals,
    };
    const {
      listed: isListed = true,
      disclaimer,
    } = assetsConfig[assetData.token] || {};

    const props = {
      id: assetData.token,
      name: assetData.name,
      token: assetData.token,
      amount: assetData.amount,
      balanceInFiat: assetData.balanceInFiat,
      onPress: this.handleCardTap,
      address: assetData.address,
      icon: assetData.iconColor,
      wallpaper: assetData.wallpaper,
      isListed,
      disclaimer,
      assetData,
    };
    const isETH = asset.symbol === ETH;

    switch (assetsLayout) {
      // case SIMPLIFIED: {
      //   return (
      //     <Swipeout
      //       right={this.renderSwipeoutButtons(asset)}
      //       sensitivity={10}
      //       backgroundColor="transparent"
      //       buttonWidth={80}
      //       close={forceHideRemoval}
      //     >
      //       <AssetCardSimplified {...props} />
      //     </Swipeout>
      //   );
      // }
      case MINIMIZED: {
        return (
          <AssetCardMinimized
            {...props}
            smallScreen={smallScreen()}
            disabledRemove={isETH}
            onRemove={onHideTokenFromWallet(asset)}
            forceHideRemoval={forceHideRemoval}
            columnCount={3}
          />
        );
      }
      case EXTRASMALL: {
        return (
          <AssetCardMinimized
            {...props}
            smallScreen={smallScreen()}
            disabledRemove={isETH}
            onRemove={onHideTokenFromWallet(asset)}
            forceHideRemoval={forceHideRemoval}
            extraSmall
            columnCount={3}
          />
        );
      }
      default: {
        return (
          <Swipeout
            right={this.renderSwipeoutButtons(asset)}
            sensitivity={10}
            backgroundColor="transparent"
            buttonWidth={80}
            close={forceHideRemoval}
          >
            <AssetCardSimplified {...props} />
          </Swipeout>
        );
        // return (
        //   <Swipeout
        //     right={this.renderSwipeoutButtons(asset)}
        //     sensitivity={10}
        //     backgroundColor="transparent"
        //     buttonWidth={80}
        //     close={forceHideRemoval}
        //   >
        //     <AssetCard {...props} icon={assetData.icon} horizontalPadding />
        //   </Swipeout>
        // );
      }
    }
  };

  renderSeparator = () => {
    return (
      <View
        style={{
          marginTop: IS_IOS ? -8 : -4,
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
      assetsLayout,
      baseFiatCurrency,
      rates,
      balances,
      horizontalPadding,
    } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    const sortedAssets = Object.keys(assets)
      .map(id => assets[id])
      .map(({ symbol, balance, ...rest }) => ({
        symbol,
        balance: getBalance(balances, symbol),
        ...rest,
      }))
      .map(({ balance, symbol, ...rest }) => ({
        balance,
        symbol,
        balanceInFiat: balance * getRate(rates, symbol, fiatCurrency),
        ...rest,
      }))
      .sort((a, b) => b.balanceInFiat - a.balanceInFiat);

    const columnAmount = (assetsLayout === MINIMIZED || assetsLayout === EXTRASMALL) ? 3 : 1;

    return (
      <FlatList
        key={assetsLayout}
        data={sortedAssets}
        keyExtractor={(item) => item.id}
        renderItem={this.renderToken}
        initialNumToRender={5}
        maxToRenderPerBatch={5}
        onEndReachedThreshold={0.5}
        style={{ width: '100%' }}
        contentContainerStyle={{
          paddingVertical: 6,
          paddingLeft: horizontalPadding(assetsLayout, 'left'),
          paddingRight: horizontalPadding(assetsLayout, 'right'),
          width: '100%',
        }}
        numColumns={columnAmount}
        ItemSeparatorComponent={(assetsLayout === SIMPLIFIED || assetsLayout === EXPANDED)
          ? this.renderSeparator
          : null}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              const { fetchAssetsBalances } = this.props;
              fetchAssetsBalances(assets);
            }}
          />
        }
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
  activeAccount: activeAccountSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchAssetsBalances: (assets) => dispatch(fetchAssetsBalancesAction(assets)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(AssetsList);
