// @flow
import * as React from 'react';
import {
  Animated,
  Easing,
  RefreshControl,
  FlatList,
  Dimensions,
  Platform,
  PixelRatio,
} from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { Transition } from 'react-navigation-fluid-transitions';
import { connect } from 'react-redux';
import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';
import type { Assets, Balances } from 'models/Asset';
import Button from 'components/Button';

import {
  fetchInitialAssetsAction,
  fetchAssetsBalancesAction,
} from 'actions/assetsActions';
import AssetCard from 'components/AssetCard';
import AssetCardSimplified from 'components/AssetCard/AssetCardSimplified';
import AssetCardMinimized from 'components/AssetCard/AssetCardMinimized';
import Header from 'components/Header';
import { Container } from 'components/Layout';
import { formatMoney } from 'utils/common';
import { FETCH_INITIAL_FAILED, defaultFiatCurrency, FETCHED } from 'constants/assetsConstants';
import { EXPANDED, SIMPLIFIED, MINIMIZED, EXTRASMALL } from 'constants/assetsLayoutConstants';
import { ASSET, ADD_TOKEN, SEND_TOKEN_FROM_ASSET_FLOW } from 'constants/navigationConstants';
import assetsConfig from 'configs/assetsConfig';
import { spacing, baseColors } from 'utils/variables';
import { SDK_PROVIDER } from 'react-native-dotenv';

type Props = {
  fetchInitialAssets: (walletAddress: string) => Function,
  fetchAssetsBalances: (assets: Assets, walletAddress: string) => Function,
  assets: Assets,
  balances: Balances,
  wallet: Object,
  rates: Object,
  assetsState: ?string,
  navigation: NavigationScreenProp<*>,
  baseFiatCurrency: string,
  assetLayout?: string,
}

const smallScreen = () => {
  if (Platform.OS === 'ios') {
    return Dimensions.get('window').width * PixelRatio.get() < 790;
  }
  return Dimensions.get('window').width < 410;
};

const horizontalPadding = (layout) => {
  switch (layout) {
    case EXTRASMALL: {
      return spacing.rhythm - (spacing.rhythm / 4);
    }
    case MINIMIZED: {
      return spacing.rhythm - (spacing.rhythm / 4);
    }
    case SIMPLIFIED: {
      return spacing.rhythm / 2;
    }
    default: {
      return spacing.rhythm;
    }
  }
};

class AssetsScreen extends React.Component<Props> {
  static navigationOptions = {
    transitionConfig: {
      duration: 300,
      timing: Animated.timing,
      easing: Easing.easing,
    },
  };

  static defaultProps = {
    assetLayout: EXPANDED,
  };

  componentDidMount() {
    const {
      fetchInitialAssets,
      assets,
      wallet,
    } = this.props;

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
    this.props.navigation.navigate(SEND_TOKEN_FROM_ASSET_FLOW, {
      asset,
    });
  };

  renderAsset = ({ item: asset }) => {
    const {
      wallet,
      baseFiatCurrency,
      assetLayout,
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

    const fullIconMonoUrl = `${SDK_PROVIDER}/${iconMonoUrl}?size=2`;
    const fullIconWallpaperUrl = `${SDK_PROVIDER}/${wallpaperUrl}`;
    const fullIconUrl = `${SDK_PROVIDER}/${iconUrl}?size=3`;
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
      onPress: () => this.handleCardTap(assetData),
      address: assetData.address,
      icon: assetData.iconColor,
      wallpaper: assetData.wallpaper,
      isListed,
      disclaimer,
    };

    switch (assetLayout) {
      case SIMPLIFIED: {
        return (
          <AssetCardSimplified {...props} />
        );
      }
      case MINIMIZED: {
        return (
          <AssetCardMinimized {...props} smallScreen={smallScreen()} />
        );
      }
      case EXTRASMALL: {
        return (
          <AssetCardMinimized
            {...props}
            smallScreen={smallScreen()}
            extraSmall
          />
        );
      }
      default: {
        return (
          <Transition key={assetData.name} shared={assetData.name}>
            <AssetCard {...props} icon={assetData.icon} />
          </Transition>
        );
      }
    }
  };

  render() {
    const {
      assets,
      wallet,
      assetsState,
      fetchInitialAssets,
      assetLayout,
      baseFiatCurrency,
      rates,
      balances,
    } = this.props;

    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;

    const sortedAssets = Object.keys(assets)
      .map(id => assets[id])
      .map(({ symbol, balance, ...rest }) => ({
        symbol,
        balance: Number(balances[symbol] && balances[symbol].balance) || 0,
        ...rest,
      }))
      .map(({ balance, symbol, ...rest }) => ({
        balance,
        symbol,
        balanceInFiat: rates[symbol] ? balance * rates[symbol][fiatCurrency] : 0,
        ...rest,
      }))
      .sort((a, b) => b.balanceInFiat - a.balanceInFiat);

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

    const columnAmount = (assetLayout === MINIMIZED || assetLayout === EXTRASMALL) ? 3 : 1;
    const containerColor = assetLayout === EXPANDED ? baseColors.white : baseColors.snowWhite;

    return (
      <Container color={containerColor}>
        <Header
          title="assets"
          onNextPress={this.goToAddTokenPage}
          nextIcon="more"
          headerRightFlex="2"
        />
        <FlatList
          data={sortedAssets}
          keyExtractor={(item) => item.id}
          renderItem={this.renderAsset}
          style={{ width: '100%' }}
          contentContainerStyle={{
            paddingHorizontal: horizontalPadding(assetLayout),
            width: '100%',
          }}
          numColumns={columnAmount}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                const { fetchAssetsBalances } = this.props;
                fetchAssetsBalances(assets, wallet.address);
              }}
            />
          }
        />
      </Container >
    );
  }
}

const mapStateToProps = ({
  wallet: { data: wallet },
  assets: { data: assets, assetsState, balances },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  wallet,
  assets,
  assetsState,
  balances,
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
