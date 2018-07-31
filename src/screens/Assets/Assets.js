// @flow
import * as React from 'react';
import {
  Animated,
  Easing,
  RefreshControl,
} from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { Transition } from 'react-navigation-fluid-transitions';
import { connect } from 'react-redux';
import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';
import type { Assets } from 'models/Asset';
import Button from 'components/Button';

import {
  fetchInitialAssetsAction,
  fetchAssetsBalancesAction,
} from 'actions/assetsActions';
import AssetCard from 'components/AssetCard';
import Header from 'components/Header';
import { Container, ScrollWrapper } from 'components/Layout';
import { formatMoney } from 'utils/common';
import { FETCH_INITIAL_FAILED, defaultFiatCurrency, FETCHED } from 'constants/assetsConstants';
import { ASSET, ADD_TOKEN, SEND_TOKEN_FLOW } from 'constants/navigationConstants';
import { SDK_PROVIDER } from 'react-native-dotenv';

type Props = {
  fetchInitialAssets: (walletAddress: string) => Function,
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  assets: Assets,
  wallet: Object,
  rates: Object,
  assetsState: ?string,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: string,
}

class AssetsScreen extends React.Component<Props> {
  static navigationOptions = {
    transitionConfig: {
      duration: 300,
      timing: Animated.timing,
      easing: Easing.easing,
    },
  };

  componentDidMount() {
    const {
      fetchInitialAssets,
      fetchAssetsBalances,
      assets,
      wallet,
    } = this.props;

    fetchAssetsBalances(assets, wallet.address);

    if (!Object.keys(assets).length) {
      fetchInitialAssets(wallet.address);
    }
  }

  handleCardTap = (assetData: Object) => {
    this.props.navigation.navigate(ASSET, {
      assetData,
    });
  };

  goToAddTokenPage = () => {
    this.props.navigation.navigate(ADD_TOKEN);
  };

  goToSendTokenFlow = (asset: Object) => {
    this.props.navigation.navigate(SEND_TOKEN_FLOW, {
      asset,
    });
  };

  renderAssets() {
    const {
      wallet,
      assets,
      rates,
      baseFiatCurrency,
    } = this.props;

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    return Object.keys(assets)
      .map(id => assets[id])
      .map(({
        symbol,
        iconMonoUrl,
        wallpaperUrl,
        balance = 0,
        ...rest
      }) => ({
        balance,
        symbol,
        iconMonoUrl,
        wallpaperUrl,
        balanceInFiat: rates[symbol] ? balance * rates[symbol][fiatCurrency] : 0,
        ...rest,
      }))
      .sort((a, b) => b.balanceInFiat - a.balanceInFiat)
      .map((asset) => {
        const {
          name,
          symbol,
          balanceInFiat,
          balance,
          iconMonoUrl,
          wallpaperUrl,
        } = asset;

        const fullIconMonoUrl = `${SDK_PROVIDER}/${iconMonoUrl}?size=2`;
        const fullIconWallpaperUrl = `${SDK_PROVIDER}/${wallpaperUrl}`;

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
          address: wallet.address,
          icon: fullIconMonoUrl,
          wallpaper: fullIconWallpaperUrl,
        };
        return (
          <Transition key={assetData.name} shared={assetData.name}>
            <AssetCard
              id={assetData.token}
              name={assetData.name}
              token={assetData.token}
              amount={assetData.amount}
              balanceInFiat={assetData.balanceInFiat}
              onPress={() => this.handleCardTap(assetData)}
              address={assetData.address}
              icon={assetData.icon}
              wallpaper={assetData.wallpaper}
            />
          </Transition>
        );
      });
  }

  render() {
    const {
      assets,
      wallet,
      assetsState,
      fetchInitialAssets,
    } = this.props;

    if (!Object.keys(assets).length && assetsState === FETCHED) {
      return (
        <Container center>
          <BaseText style={{ marginBottom: 20 }}>Loading default assets</BaseText>
          {assetsState !== FETCH_INITIAL_FAILED && (
            <Spinner />
          )}
          {assetsState === FETCH_INITIAL_FAILED && (
            <Button title="Try again" onPress={() => fetchInitialAssets(wallet.address)} />
          )}
        </Container>
      );
    }

    return (
      <Container>
        <Header
          title="assets"
          onNextPress={this.goToAddTokenPage}
          nextText="manage tokens"
        />
        <ScrollWrapper
          regularPadding
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                const { fetchAssetsBalances } = this.props;
                fetchAssetsBalances(assets, wallet.address);
              }}
            />
          }
        >
          {this.renderAssets()}
        </ScrollWrapper>
      </Container >
    );
  }
}

const mapStateToProps = ({
  wallet: { data: wallet },
  assets: { data: assets, assetsState },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  wallet,
  assets,
  assetsState,
  rates,
  baseFiatCurrency,
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchInitialAssets: (walletAddress) => {
    dispatch(fetchInitialAssetsAction(walletAddress));
  },
  fetchAssetsBalances: (assets, walletAddress) => {
    dispatch(fetchAssetsBalancesAction(assets, walletAddress));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(AssetsScreen);
