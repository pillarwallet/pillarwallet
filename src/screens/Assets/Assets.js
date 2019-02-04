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
import {
  RefreshControl,
  FlatList,
  SectionList,
  Dimensions,
  Platform,
  PixelRatio,
  View,
  Alert,
  Keyboard,
  Switch,
} from 'react-native';
import styled from 'styled-components/native';
import isEqual from 'lodash.isequal';
import type { NavigationEventSubscription, NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import Swipeout from 'react-native-swipeout';
import { SDK_PROVIDER } from 'react-native-dotenv';

// components
import { BaseText } from 'components/Typography';
import Spinner from 'components/Spinner';
import Button from 'components/Button';
import Toast from 'components/Toast';
// import AssetCard from 'components/AssetCard';
import AssetCardSimplified from 'components/AssetCard/AssetCardSimplified';
import AssetCardMinimized from 'components/AssetCard/AssetCardMinimized';
import { Container, Wrapper } from 'components/Layout';
import HideAssetButton from 'screens/Assets/HideAssetButton';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import SearchBlock from 'components/SearchBlock';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Separator from 'components/Separator';

// types
import type { Assets, Balances, Asset } from 'models/Asset';

// actions
import {
  updateAssetsAction,
  fetchInitialAssetsAction,
  fetchAssetsBalancesAction,
  startAssetsSearchAction,
  searchAssetsAction,
  resetSearchAssetsResultAction,
  addAssetAction,
  removeAssetAction,
} from 'actions/assetsActions';

// constants
import { FETCH_INITIAL_FAILED, defaultFiatCurrency, FETCHED, FETCHING, ETH } from 'constants/assetsConstants';
import { EXPANDED, SIMPLIFIED, MINIMIZED, EXTRASMALL } from 'constants/assetsLayoutConstants';
import { ASSET } from 'constants/navigationConstants';

// configs
import assetsConfig from 'configs/assetsConfig';

// utils
import { formatMoney } from 'utils/common';
import { spacing, baseColors } from 'utils/variables';
import { getBalance, getRate } from 'utils/assets';
import debounce from 'lodash.debounce';

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
  startAssetsSearch: Function,
  searchAssets: Function,
  resetSearchAssetsResult: Function,
  assetsSearchResults: Asset[],
  assetsSearchState: string,
  addAsset: Function,
  removeAsset: Function,
}

type State = {
  forceHideRemoval: boolean,
  query: string,
}

const IS_IOS = Platform.OS === 'ios';
const MIN_QUERY_LENGTH = 2;
const genericToken = require('assets/images/tokens/genericToken.png');

const smallScreen = () => {
  if (IS_IOS) {
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
    // case SIMPLIFIED: {
    //   if (Platform.OS === 'android') return 10;
    //   return side === 'left' ? 0 : spacing.rhythm - 9;
    // }
    default: {
      // if (Platform.OS === 'android') return 10;
      // return 0;
      if (Platform.OS === 'android') return 10;
      return side === 'left' ? 0 : spacing.rhythm - 9;
    }
  }
};

const TokensWrapper = styled(Wrapper)`
   flex: 1;
   height: 100%;
`;

const SearchSpinner = styled(Wrapper)`
  padding-top: 20;
`;

class AssetsScreen extends React.Component<Props, State> {
  didBlur: NavigationEventSubscription;
  willFocus: NavigationEventSubscription;

  constructor(props: Props) {
    super(props);
    this.state = {
      forceHideRemoval: false,
      query: '',
    };
    this.doAssetsSearch = debounce(this.doAssetsSearch, 500);
  }

  static defaultProps = {
    assetsLayout: SIMPLIFIED,
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

  handleSearchChange = (query: string) => {
    const formattedQuery = !query ? '' : query.trim();

    this.setState({
      query: formattedQuery,
    });
    this.props.startAssetsSearch();
    this.doAssetsSearch(formattedQuery);
  };

  doAssetsSearch = (query: string) => {
    const { searchAssets, resetSearchAssetsResult } = this.props;
    if (query.length < MIN_QUERY_LENGTH) {
      resetSearchAssetsResult();
      return;
    }
    searchAssets(query);
  };

  handleAssetToggle = (asset: Asset, added: Boolean) => {
    if (!added) {
      this.addTokenToWallet(asset);
    } else {
      this.hideTokenFromWallet(asset);
    }
  };

  resetHideRemoval = () => {
    this.setState({ forceHideRemoval: false });
  };

  handleAssetRemoval = (asset: Asset) => () => {
    const { assets, updateAssets } = this.props;
    Alert.alert(
      'Are you sure?',
      `This will hide ${asset.name} from your wallet`,
      [
        { text: 'Cancel', onPress: () => this.setState({ forceHideRemoval: true }), style: 'cancel' },
        { text: 'Hide', onPress: () => { this.hideTokenFromWallet(asset); updateAssets(assets, [asset.symbol]); } },
      ],
    );
  };

  renderSwipeoutBtns = (asset) => {
    // const { assetsLayout } = this.props;
    // const isExpanded = assetsLayout === EXPANDED;
    const isETH = asset.symbol === ETH;
    return [{
      component: (
        <HideAssetButton
          // expanded={isExpanded}
          onPress={isETH ? this.showETHRemovalNotification : this.handleAssetRemoval(asset)}
          disabled={isETH}
        />),
      backgroundColor: 'transparent',
      disabled: true,
    }];
  };

  showETHRemovalNotification = () => {
    Toast.show({
      message: 'Ethereum is essential for Pillar',
      type: 'info',
      title: 'This asset cannot be switched off',
    });
  };

  renderAsset = ({ item: asset }) => {
    const {
      wallet,
      baseFiatCurrency,
      assetsLayout,
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
      //       right={this.renderSwipeoutBtns(asset)}
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
            onRemove={this.handleAssetRemoval(asset)}
            forceHideRemoval={forceHideRemoval}
          />
        );
      }
      case EXTRASMALL: {
        return (
          <AssetCardMinimized
            {...props}
            smallScreen={smallScreen()}
            disabledRemove={isETH}
            onRemove={this.handleAssetRemoval(asset)}
            forceHideRemoval={forceHideRemoval}
            extraSmall
          />
        );
      }
      default: {
        return (
          <Swipeout
            right={this.renderSwipeoutBtns(asset)}
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
        //     right={this.renderSwipeoutBtns(asset)}
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

  renderFoundTokensList() {
    const {
      assets,
      assetsSearchResults,
    } = this.props;
    const addedAssets = [];
    const foundAssets = [];

    assetsSearchResults.forEach((result) => {
      if (!assets[result.symbol]) {
        foundAssets.push(result);
      } else {
        addedAssets.push(result);
      }
    });

    const sections = [];
    if (addedAssets.length) sections.push({ title: 'ADDED TOKENS', data: addedAssets, extraData: assets });
    if (foundAssets.length) sections.push({ title: 'FOUND TOKENS', data: foundAssets, extraData: assets });

    const renderItem = ({ item: asset }) => {
      const {
        symbol,
        name,
        iconUrl,
      } = asset;

      const isAdded = !!assets[symbol];
      const fullIconUrl = `${SDK_PROVIDER}/${iconUrl}?size=3`;

      return (
        <ListItemWithImage
          label={name}
          subtext={symbol}
          itemImageUrl={fullIconUrl}
          fallbackSource={genericToken}
          small
        >
          <Switch
            thumbColor={baseColors.electricBlue}
            onValueChange={() => this.handleAssetToggle(asset, isAdded)}
            value={!!isAdded}
          />
        </ListItemWithImage>
      );
    };

    return (
      <SectionList
        renderItem={renderItem}
        sections={sections}
        keyExtractor={(item) => item.symbol}
        style={{ width: '100%' }}
        contentContainerStyle={{
          width: '100%',
        }}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
        ListEmptyComponent={
          <Wrapper
            fullScreen
            style={{
              paddingTop: 90,
              paddingBottom: 90,
              alignItems: 'center',
            }}
          >
            <EmptyStateParagraph
              title="Token not found"
              bodyText="Check if the name was entered correctly or add custom token"
            />
          </Wrapper>
        }
        onScroll={() => Keyboard.dismiss()}
      />
    );
  }

  addTokenToWallet = (asset: Asset) => {
    const { addAsset } = this.props;

    addAsset(asset);
    Toast.show({
      title: null,
      message: `${asset.name} (${asset.symbol}) has been added`,
      type: 'info',
      autoClose: true,
    });
  };

  hideTokenFromWallet = (asset: Asset) => {
    const {
      removeAsset,
    } = this.props;

    if (asset.symbol === ETH) {
      this.showETHRemovalNotification();
      return;
    }

    removeAsset(asset);
    Toast.show({
      title: null,
      message: `${asset.name} (${asset.symbol}) has been hidden`,
      type: 'info',
      autoClose: true,
    });
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
      assetsSearchState,
      navigation,
    } = this.props;
    const { query } = this.state;
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
    const isSearchOver = assetsSearchState === FETCHED;
    const isSearching = assetsSearchState === FETCHING && query.length >= MIN_QUERY_LENGTH;
    const inSearchMode = (query.length >= MIN_QUERY_LENGTH && !!assetsSearchState);

    return (
      <Container inset={{ bottom: 0 }}>
        <SearchBlock
          headerProps={{ title: 'assets' }}
          searchInputPlaceholder="Search or add new asset"
          onSearchChange={(q) => this.handleSearchChange(q)}
          itemSearchState={assetsSearchState}
          navigation={navigation}
        />
        <TokensWrapper>
          {inSearchMode && isSearchOver &&
          <Wrapper>
            {this.renderFoundTokensList()}
          </Wrapper>
          }
          {isSearching &&
          <SearchSpinner center>
            <Spinner />
          </SearchSpinner>
          }
          {!inSearchMode &&
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
                  fetchAssetsBalances(assets, wallet.address);
                }}
              />
            }
          />}
        </TokensWrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({
  wallet: { data: wallet },
  assets: {
    data: assets,
    assetsState,
    balances,
    assetsSearchState,
    assetsSearchResults,
  },
  rates: { data: rates },
  appSettings: { data: { baseFiatCurrency, appearanceSettings: { assetsLayout } } },
}) => ({
  wallet,
  assets,
  assetsState,
  balances,
  assetsSearchState,
  assetsSearchResults,
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
  startAssetsSearch: () => dispatch(startAssetsSearchAction()),
  searchAssets: (query: string) => dispatch(searchAssetsAction(query)),
  resetSearchAssetsResult: () => dispatch(resetSearchAssetsResultAction()),
  addAsset: (asset: Asset) => dispatch(addAssetAction(asset)),
  removeAsset: (asset: Asset) => dispatch(removeAssetAction(asset)),
});

export default connect(mapStateToProps, mapDispatchToProps)(AssetsScreen);
