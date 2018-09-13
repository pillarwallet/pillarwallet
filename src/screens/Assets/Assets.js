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
  View,
} from 'react-native';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';
import { Transition } from 'react-navigation-fluid-transitions';
import { connect } from 'react-redux';
import Swipeout from 'react-native-swipeout';
import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';
import type { Assets, Balances, Asset } from 'models/Asset';
import Button from 'components/Button';
import Toast from 'components/Toast';
import {
  removeAssetAction,
  updateAssetsAction,
  fetchInitialAssetsAction,
  fetchAssetsBalancesAction,
} from 'actions/assetsActions';
import AssetCard from 'components/AssetCard';
import AssetCardSimplified from 'components/AssetCard/AssetCardSimplified';
import AssetCardMinimized from 'components/AssetCard/AssetCardMinimized';
import Header from 'components/Header';
import { Container } from 'components/Layout';
import { formatMoney } from 'utils/common';
import { FETCH_INITIAL_FAILED, defaultFiatCurrency, FETCHED, ETH } from 'constants/assetsConstants';
import { EXPANDED, SIMPLIFIED, MINIMIZED, EXTRASMALL } from 'constants/assetsLayoutConstants';
import { ASSET, ADD_TOKEN, SEND_TOKEN_FROM_ASSET_FLOW } from 'constants/navigationConstants';
import assetsConfig from 'configs/assetsConfig';
import { spacing, baseColors } from 'utils/variables';
import { SDK_PROVIDER } from 'react-native-dotenv';
import { HideAssetButton } from './HideAssetButton';

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
  assetsLayout: string,
  removeAsset: Function,
}

type State = {
  forceHideRemoval: boolean,
}

const smallScreen = () => {
  if (Platform.OS === 'ios') {
    return Dimensions.get('window').width * PixelRatio.get() < 650;
  }
  return Dimensions.get('window').width < 410;
};

const horizontalPadding = (layout, side) => {
  switch (layout) {
    case EXTRASMALL: {
      return spacing.rhythm - (spacing.rhythm / 4);
    }
    case MINIMIZED: {
      return spacing.rhythm - (spacing.rhythm / 4);
    }
    case SIMPLIFIED: {
      return side === 'left' ? 0 : spacing.rhythm - 9;
    }
    default: {
      return side === 'left' ? 0 : spacing.rhythm - 2;
    }
  }
};

const isETH = (thisSymbol) => {
  return thisSymbol === ETH;
};

class AssetsScreen extends React.Component<Props, State> {
  didBlur: NavigationEventSubscription;
  willFocus: NavigationEventSubscription;

  constructor(props: Props) {
    super(props);
    this.state = {
      forceHideRemoval: false,
    };
  }

  static navigationOptions = {
    transitionConfig: {
      duration: 300,
      timing: Animated.timing,
      easing: Easing.easing,
    },
  };

  static defaultProps = {
    assetsLayout: EXPANDED,
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

    this.willFocus = this.props.navigation.addListener(
      'willFocus',
      () => { this.setState({ forceHideRemoval: false }); },
    );

    this.didBlur = this.props.navigation.addListener(
      'didBlur',
      () => { this.setState({ forceHideRemoval: true }); },
    );
  }

  componentWillUnmount() {
    this.didBlur.remove();
    this.willFocus.remove();
  }

  handleCardTap = (assetData: Object) => {
    this.setState({ forceHideRemoval: true });
    this.props.navigation.navigate(ASSET,
      {
        assetData,
        test: 'test',
        resetHideRemoval: this.resetHideRemoval,
      },
    );
  };

  // since navigation to ASSET screen is managed by another navigation
  // the willFocus is not triggered after getting back to the screen -
  // since it is never blurred
  resetHideRemoval = () => {
    this.setState({ forceHideRemoval: false });
  };

  goToAddTokenPage = () => {
    this.props.navigation.navigate(ADD_TOKEN);
  };

  goToSendTokenFlow = (asset: Object) => {
    this.props.navigation.navigate(SEND_TOKEN_FROM_ASSET_FLOW, {
      asset,
    });
  };

  swipeoutBtns = (asset, isThisETH) => {
    const { removeAsset } = this.props;
    return [
      {
        component: (
          <HideAssetButton
            expanded={this.props.assetsLayout === EXPANDED}
            onPress={isThisETH ? this.showETHRemovalNotification : () => removeAsset(asset)}
            disabled={isThisETH}
          />),
        backgroundColor: 'transparent',
        disabled: true,
      },
    ];
  };

  showETHRemovalNotification = () => {
    Toast.show({
      message: 'Ethereum is essential for Pillar Wallet',
      type: 'info',
      title: 'This asset cannot be switched off',
    });
  };

  renderAsset = ({ item: asset }) => {
    const {
      wallet,
      baseFiatCurrency,
      assetsLayout,
      removeAsset,
    } = this.props;

    const { forceHideRemoval } = this.state;

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

    switch (assetsLayout) {
      case SIMPLIFIED: {
        return (
          <Swipeout
            right={this.swipeoutBtns(asset, isETH(symbol))}
            sensitivity={10}
            backgroundColor="transparent"
            buttonWidth={80}
          >
            <AssetCardSimplified {...props} />
          </Swipeout>
        );
      }
      case MINIMIZED: {
        return (
          <AssetCardMinimized
            {...props}
            smallScreen={smallScreen()}
            disabledRemove={isETH(symbol)}
            removeThisAsset={() => { removeAsset(asset); }}
            forceHideRemoval={forceHideRemoval}
          />
        );
      }
      case EXTRASMALL: {
        return (
          <AssetCardMinimized
            {...props}
            smallScreen={smallScreen()}
            disabledRemove={isETH(symbol)}
            removeThisAsset={() => { removeAsset(asset); }}
            forceHideRemoval={forceHideRemoval}
            extraSmall
          />
        );
      }
      default: {
        return (
          <Swipeout
            right={this.swipeoutBtns(asset, isETH(symbol))}
            sensitivity={10}
            backgroundColor="transparent"
            buttonWidth={80}
            close={forceHideRemoval}
          >
            <Transition key={assetData.name} shared={assetData.name}>
              <AssetCard {...props} icon={assetData.icon} horizontalPadding />
            </Transition>
          </Swipeout>
        );
      }
    }
  };

  renderSeparator = () => {
    return (
      <View
        style={{
          marginTop: -22,
          height: 1,
          width: '100%',
          backgroundColor: 'transparent',
        }}
      />
    );
  };

  render() {
    const {
      assets,
      wallet,
      assetsState,
      fetchInitialAssets,
      assetsLayout,
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

    const columnAmount = (assetsLayout === MINIMIZED || assetsLayout === EXTRASMALL) ? 3 : 1;
    const containerColor = assetsLayout === EXPANDED ? baseColors.white : baseColors.snowWhite;

    return (
      <Container color={containerColor}>
        <Header
          title="assets"
          onNextPress={this.goToAddTokenPage}
          nextIcon="more"
          headerRightFlex="2"
        />
        <FlatList
          key={assetsLayout}
          data={sortedAssets}
          keyExtractor={(item) => item.id}
          renderItem={this.renderAsset}
          style={{ width: '100%' }}
          contentContainerStyle={{
            paddingLeft: horizontalPadding(assetsLayout, 'left'),
            paddingRight: horizontalPadding(assetsLayout, 'right'),
            width: '100%',
          }}
          numColumns={columnAmount}
          ItemSeparatorComponent={assetsLayout === SIMPLIFIED ? this.renderSeparator : null}
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
  appSettings: { data: { baseFiatCurrency, appearanceSettings: { assetsLayout } } },
}) => ({
  wallet,
  assets,
  assetsState,
  balances,
  rates,
  baseFiatCurrency,
  assetsLayout,
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchInitialAssets: (walletAddress) => {
    dispatch(fetchInitialAssetsAction(walletAddress));
  },
  fetchAssetsBalances: (assets, walletAddress) => {
    dispatch(fetchAssetsBalancesAction(assets, walletAddress));
  },
  removeAsset: (asset: Asset) => dispatch(removeAssetAction(asset)),
  updateAssets: (assets: Assets) => dispatch(updateAssetsAction(assets)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AssetsScreen);
