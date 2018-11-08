// @flow
import * as React from 'react';
import {
  RefreshControl,
  FlatList,
  // Dimensions,
  Platform,
  // PixelRatio,
  View,
  Alert,
  TouchableOpacity,
  Text,
} from 'react-native';
import isEqual from 'lodash.isequal';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
// import Swipeout from 'react-native-swipeout';
import { SDK_PROVIDER } from 'react-native-dotenv';

// components
import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';
import Button from 'components/Button';
import Toast from 'components/Toast';
// import AssetCard from 'components/AssetCard';
// import AssetCardSimplified from 'components/AssetCard/AssetCardSimplified';
// import AssetCardMinimized from 'components/AssetCard/AssetCardMinimized';
import Header from 'components/Header';
import { Container } from 'components/Layout';
import HideAssetButton from 'screens/Assets/HideAssetButton';

// types
import type { Assets, Balances, Asset } from 'models/Asset';

// actions
import {
  updateAssetsAction,
  fetchInitialAssetsAction,
  fetchAssetsBalancesAction,
} from 'actions/assetsActions';

// constants
import { FETCH_INITIAL_FAILED, defaultFiatCurrency, FETCHED, ETH } from 'constants/assetsConstants';
import { EXPANDED, SIMPLIFIED, MINIMIZED, EXTRASMALL } from 'constants/assetsLayoutConstants';
import { ASSET, ADD_TOKEN, SEND_TOKEN_FROM_ASSET_FLOW } from 'constants/navigationConstants';

// configs
// import assetsConfig from 'configs/assetsConfig';

// utils
import { formatMoney } from 'utils/common';
import { spacing } from 'utils/variables';
import { getBalance, getRate } from 'utils/assets';
import AssetPattern from 'components/AssetPattern';

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
  updateAssets: Function,
}

type State = {
  forceHideRemoval: boolean,
}

// const smallScreen = () => {
//   if (Platform.OS === 'ios') {
//     return Dimensions.get('window').width * PixelRatio.get() < 650;
//   }
//   return Dimensions.get('window').width < 410;
// };

const horizontalPadding = (layout, side) => {
  switch (layout) {
    case EXTRASMALL: {
      return spacing.rhythm - (spacing.rhythm / 4);
    }
    case MINIMIZED: {
      return spacing.rhythm - (spacing.rhythm / 4);
    }
    case SIMPLIFIED: {
      if (Platform.OS === 'android') return 10;
      return side === 'left' ? 0 : spacing.rhythm - 9;
    }
    default: {
      // if (Platform.OS === 'android') return 10;
      return 0;
    }
  }
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

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

  handleCardTap = (assetData: Object) => {
    this.setState({ forceHideRemoval: true });
    this.props.navigation.navigate(ASSET,
      {
        assetData,
        resetHideRemoval: this.resetHideRemoval,
      },
    );
  };

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

  handleAssetRemoval = (asset: Asset) => () => {
    const { assets, updateAssets } = this.props;
    Alert.alert(
      'Are you sure?',
      `This will hide ${asset.name} from your wallet`,
      [
        { text: 'Cancel', onPress: () => this.setState({ forceHideRemoval: true }), style: 'cancel' },
        { text: 'Hide', onPress: () => updateAssets(assets, [asset.symbol]) },
      ],
    );
  };

  renderSwipeoutBtns = (asset) => {
    const { assetsLayout } = this.props;
    const isExpanded = assetsLayout === EXPANDED;
    const isETH = asset.symbol === ETH;
    return [{
      component: (
        <HideAssetButton
          expanded={isExpanded}
          onPress={isETH ? this.showETHRemovalNotification : this.handleAssetRemoval(asset)}
          disabled={isETH}
        />),
      backgroundColor: 'transparent',
      disabled: true,
    }];
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
      // assetsLayout,
    } = this.props;

    // const { forceHideRemoval } = this.state;
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
    // const {
    //   listed: isListed = true,
    //   disclaimer,
    // } = assetsConfig[assetData.token] || {};

    // const props = {
    //   id: assetData.token,
    //   name: assetData.name,
    //   token: assetData.token,
    //   amount: assetData.amount,
    //   balanceInFiat: assetData.balanceInFiat,
    //   onPress: this.handleCardTap,
    //   address: assetData.address,
    //   icon: assetData.iconColor,
    //   wallpaper: assetData.wallpaper,
    //   isListed,
    //   disclaimer,
    //   assetData,
    // };
    // const isETH = asset.symbol === ETH;

    const uniqueCode = [];
    [...assetData.token].forEach((letter) => {
      uniqueCode.push(letter.charCodeAt(0));
    });

    return (
      <TouchableOpacity onPress={() => this.handleCardTap(assetData)}>
        <AssetPattern
          token={asset.symbol}
          icon={assetData.iconColor}
          contractAddress={assetData.contractAddress}
          isListed
        />
        <Text style={{ flex: 1, textAlign: 'center' }}>
          {uniqueCode}
        </Text>
      </TouchableOpacity>
    );

    // switch (assetsLayout) {
    //   case SIMPLIFIED: {
    //     return (
    //       <Swipeout
    //         right={this.renderSwipeoutBtns(asset)}
    //         sensitivity={10}
    //         backgroundColor="transparent"
    //         buttonWidth={80}
    //         close={forceHideRemoval}
    //       >
    //         <AssetCardSimplified {...props} />
    //       </Swipeout>
    //     );
    //   }
    //   case MINIMIZED: {
    //     return (
    //       <AssetCardMinimized
    //         {...props}
    //         smallScreen={smallScreen()}
    //         disabledRemove={isETH}
    //         onRemove={this.handleAssetRemoval(asset)}
    //         forceHideRemoval={forceHideRemoval}
    //       />
    //     );
    //   }
    //   case EXTRASMALL: {
    //     return (
    //       <AssetCardMinimized
    //         {...props}
    //         smallScreen={smallScreen()}
    //         disabledRemove={isETH}
    //         onRemove={this.handleAssetRemoval(asset)}
    //         forceHideRemoval={forceHideRemoval}
    //         extraSmall
    //       />
    //     );
    //   }
    //   default: {
    //     return (
    //       <Swipeout
    //         right={this.renderSwipeoutBtns(asset)}
    //         sensitivity={10}
    //         backgroundColor="transparent"
    //         buttonWidth={80}
    //         close={forceHideRemoval}
    //       >
    //         <AssetCard {...props} icon={assetData.icon} horizontalPadding />
    //       </Swipeout>
    //     );
    //   }
    // }
  };

  renderSeparator = () => {
    return (
      <View
        style={{
          marginTop: Platform.OS === 'ios' ? -8 : -4,
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

    if (!Object.keys(assets).length && assetsState === FETCHED) {
      return (
        <Container center inset={{ bottom: 0 }}>
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

    return (
      <Container inset={{ bottom: 0 }}>
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
          initialNumToRender={5}
          maxToRenderPerBatch={5}
          onEndReachedThreshold={0.5}
          style={{ width: '100%' }}
          contentContainerStyle={{
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
  updateAssets: (assets: Assets, assetsToExclude: string[]) => dispatch(updateAssetsAction(assets, assetsToExclude)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AssetsScreen);
