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
import { Keyboard, Switch, SectionList, Platform, ScrollView } from 'react-native';
import styled from 'styled-components/native';
import { SDK_PROVIDER } from 'react-native-dotenv';
import { createStructuredSelector } from 'reselect';
import { withNavigation } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';

import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { BaseText, BoldText } from 'components/Typography';
import Tabs from 'components/Tabs';
import { Insight } from 'components/Insight';
import { Wrapper, ScrollWrapper } from 'components/Layout';
import SearchBlock from 'components/SearchBlock';
import Toast from 'components/Toast';

import { formatMoney, getCurrencySymbol } from 'utils/common';
import { baseColors, fontSizes, spacing } from 'utils/variables';
import { getAccountAddress } from 'utils/accounts';

import {
  FETCHED,
  FETCHING,
  TOKENS,
  COLLECTIBLES,
  defaultFiatCurrency,
  ETH,
} from 'constants/assetsConstants';
import { ASSET } from 'constants/navigationConstants';

import { activeAccountSelector } from 'selectors';
import { paymentNetworkAccountBalancesSelector } from 'selectors/paymentNetwork';
import { accountCollectiblesSelector } from 'selectors/collectibles';
import Spinner from 'components/Spinner';
import Separator from 'components/Separator';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';

import type { Asset, Assets, Balances } from 'models/Asset';
import type { Collectible } from 'models/Collectible';

// actions
import {
  updateAssetsAction,
  fetchInitialAssetsAction,
  startAssetsSearchAction,
  searchAssetsAction,
  resetSearchAssetsResultAction,
  addAssetAction,
  removeAssetAction,
} from 'actions/assetsActions';
import debounce from 'lodash.debounce';

import CollectiblesList from './CollectiblesList';
import AssetsList from './AssetsList';

type Props = {
  baseFiatCurrency: string,
  assets: Assets,
  paymentNetworkBalances: Balances,
  collectibles: Collectible[],
  navigation: NavigationScreenProp<*>,
  tabs: Object[],
  activeTab: string,
  showInsight: boolean,
  blockAssetsView?: boolean,
  sendingBlockedMessage: Object,
  hideInsight: Function,
  insightList: Object[],
  insightsTitle: string,
  assetsSearchResults: Asset[],
  activeAccount: Object,
  startAssetsSearch: Function,
  searchAssets: Function,
  resetSearchAssetsResult: Function,
  addAsset: Function,
  removeAsset: Function,
  updateAssets: Function,
  assetsSearchState: string,
}

type State = {
  query: string,
  searchScrollTop: number,
  activeTab: string,
}

const MIN_QUERY_LENGTH = 2;

const MessageTitle = styled(BoldText)`
  font-size: ${fontSizes.large}px;
  text-align: center;
`;

const Message = styled(BaseText)`
  padding-top: 20px;
  font-size: ${fontSizes.extraSmall}px;
  color: ${baseColors.darkGray};
  text-align: center;
`;

const SearchSpinner = styled(Wrapper)`
  padding-top: 20;
`;

const ListWrapper = styled.View`
  position: relative;
  flex: 1;
  margin-top: -10px;
`;

const EmptyStateWrapper = styled(Wrapper)`
  padding-top: 90px;
  padding-bottom: 90px;
  align-items: center;
`;

const genericToken = require('assets/images/tokens/genericToken.png');

/**
 * due to KeyboardAwareScrollView issues with stickyHeaderIndices on Android
 * separate scrolling wrappers are implemented for iOS and Android
 * (Android natively supports keyboard aware view due to windowSoftInputMode set in AndroidManifest.xml)
 */
const CustomKAWrapper = (props) => {
  const { onScroll, children, innerRef } = props;
  const scrollWrapperProps = {
    stickyHeaderIndices: [2],
    style: { backgroundColor: baseColors.white },
    contentContainerStyle: {
      flexGrow: 1,
      backgroundColor: baseColors.white,
    },
    onScroll,
  };

  if (Platform.OS === 'ios') {
    return (
      <ScrollWrapper
        innerRef={innerRef}
        {...scrollWrapperProps}
      >
        {children}
      </ScrollWrapper>
    );
  }

  return (
    <ScrollView
      ref={innerRef}
      {...scrollWrapperProps}
    >
      {children}
    </ScrollView>
  );
};

class WalletView extends React.Component<Props, State> {
  scrollWrapperRef: ?Object;

  constructor(props: Props) {
    super(props);
    this.state = {
      query: '',
      searchScrollTop: 0,
      activeTab: TOKENS,
      // forceHideRemoval: false,
    };
    this.doAssetsSearch = debounce(this.doAssetsSearch, 500);
  }

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
          paddingTop: spacing.mediumLarge,
        }}
        stickySectionHeadersEnabled={false}
        ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
        ListEmptyComponent={
          <EmptyStateWrapper fullScreen>
            <EmptyStateParagraph
              title="Token not found"
              bodyText="Check if the name was entered correctly or add custom token"
            />
          </EmptyStateWrapper>
        }
        onScroll={() => Keyboard.dismiss()}
      />
    );
  }

  renderAsset = ({ item: asset }) => {
    const { baseFiatCurrency, navigation, activeAccount } = this.props;
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    const currencySymbol = getCurrencySymbol(fiatCurrency);

    const {
      name,
      symbol,
      iconUrl,
      balance,
      balanceInFiat,
      iconMonoUrl,
      decimals,
      patternUrl,
    } = asset;

    const fullIconMonoUrl = iconMonoUrl ? `${SDK_PROVIDER}/${iconMonoUrl}?size=2` : '';
    const fullIconUrl = iconUrl ? `${SDK_PROVIDER}/${iconUrl}?size=3` : '';
    const patternIcon = patternUrl ? `${SDK_PROVIDER}/${patternUrl}?size=3` : fullIconUrl;
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
      decimals,
      patternIcon,
    };

    return (
      <ListItemWithImage
        onPress={() => {
          navigation.navigate(ASSET,
            {
              assetData: {
                ...assetData,
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

  handleSearchChange = (query: string) => {
    const { activeTab } = this.state;
    const { startAssetsSearch } = this.props;
    const formattedQuery = !query ? '' : query.trim();

    this.setState({
      query: formattedQuery,
    });

    if (activeTab === TOKENS) {
      startAssetsSearch();
      this.doAssetsSearch(formattedQuery);
    }
  };

  doAssetsSearch = (query: string) => {
    const { searchAssets, resetSearchAssetsResult } = this.props;
    if (query.length < MIN_QUERY_LENGTH) {
      resetSearchAssetsResult();
      return;
    }
    searchAssets(query);
  };

  setActiveTab = (activeTab) => {
    this.setState({ activeTab });
  };

  handleAssetToggle = (asset: Asset, added: Boolean) => {
    if (!added) {
      this.addTokenToWallet(asset);
    } else {
      this.hideTokenFromWallet(asset);
    }
  };

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

  showETHRemovalNotification = () => {
    Toast.show({
      message: 'Ethereum is essential for Pillar',
      type: 'info',
      title: 'This asset cannot be switched off',
    });
  };

  // TODO: revisit keyboard dismiss on search results scroll
  onWrapperScroll = () => {
  };

  render() {
    const {
      query,
      searchScrollTop,
      activeTab,
    } = this.state;
    const {
      collectibles,
      navigation,
      showInsight,
      blockAssetsView,
      sendingBlockedMessage = {},
      hideInsight,
      insightList = [],
      insightsTitle,
      assetsSearchState,
    } = this.props;

    // SEARCH
    const isSearchOver = assetsSearchState === FETCHED;
    const isSearching = assetsSearchState === FETCHING && query.length >= MIN_QUERY_LENGTH;
    const inAssetSearchMode = (query.length >= MIN_QUERY_LENGTH && !!assetsSearchState);
    const isInCollectiblesSearchMode = (query && query.length >= MIN_QUERY_LENGTH) && activeTab === COLLECTIBLES;
    const isInSearchMode = inAssetSearchMode || isInCollectiblesSearchMode;

    const filteredCollectibles = isInCollectiblesSearchMode
      ? collectibles.filter(({ name }) => name.toUpperCase().includes(query.toUpperCase()))
      : collectibles;

    const assetsTabs = [
      {
        id: TOKENS,
        name: 'Tokens',
        onPress: () => this.setActiveTab(TOKENS),
      },
      {
        id: COLLECTIBLES,
        name: 'Collectibles',
        onPress: () => this.setActiveTab(COLLECTIBLES),
      },
    ];

    return (
      <CustomKAWrapper
        onScroll={() => this.onWrapperScroll()}
        innerRef={ref => { this.scrollWrapperRef = ref; }}
      >
        <Insight
          isVisible={showInsight}
          title={insightsTitle}
          insightList={insightList}
          onClose={() => {
            this.setState({ searchScrollTop: 0 });
            hideInsight();
          }}
          onLayout={(e) => {
            this.setState({ searchScrollTop: e.nativeEvent.layout.height });
          }}
          wrapperStyle={{ borderBottomWidth: 1, borderBottomColor: baseColors.mediumLightGray }}
        />
        {blockAssetsView &&
        <Wrapper flex={1} regularPadding center>
          <MessageTitle>{ sendingBlockedMessage.title }</MessageTitle>
          <Message>{ sendingBlockedMessage.message }</Message>
          <Wrapper style={{ marginTop: 20, width: '100%', alignItems: 'center' }}>
            <Spinner />
          </Wrapper>
        </Wrapper>}
        {!blockAssetsView &&
        <SearchBlock
          hideSearch={blockAssetsView}
          searchInputPlaceholder={activeTab === TOKENS ? 'Search asset' : 'Search collectible'}
          onSearchChange={this.handleSearchChange}
          wrapperStyle={{ paddingHorizontal: spacing.large, paddingTop: spacing.mediumLarge }}
          onSearchFocus={() => {
            if (this.scrollWrapperRef) {
              if (Platform.OS === 'ios') {
                this.scrollWrapperRef.scrollToPosition(0, searchScrollTop, true);
              } else {
                this.scrollWrapperRef.scrollTo({ x: 0, y: searchScrollTop, animated: true });
              }
            }
          }}
          itemSearchState={!!isInSearchMode}
          navigation={navigation}
          white
        />}
        {!isInSearchMode && !blockAssetsView &&
        <Tabs
          initialActiveTab={activeTab}
          tabs={assetsTabs}
        />}
        {isSearching &&
        <SearchSpinner center>
          <Spinner />
        </SearchSpinner>
        }
        {!blockAssetsView &&
        <ListWrapper>
          {inAssetSearchMode && isSearchOver &&
          <Wrapper>
            {this.renderFoundTokensList()}
          </Wrapper>
          }
          {activeTab === TOKENS && !inAssetSearchMode && (
            <AssetsList />
          )}
          {activeTab === COLLECTIBLES && (
            <CollectiblesList
              collectibles={filteredCollectibles}
              searchQuery={query}
              navigation={navigation}
              // horizontalPadding={horizontalPadding}
              // updateHideRemoval={this.updateHideRemoval}
            />)}
        </ListWrapper>}
      </CustomKAWrapper>
    );
  }
}

const mapStateToProps = ({
  assets: {
    data: assets,
    assetsState,
    assetsSearchState,
    assetsSearchResults,
  },
  appSettings: { data: { baseFiatCurrency } },
}) => ({
  assets,
  assetsState,
  assetsSearchState,
  assetsSearchResults,
  baseFiatCurrency,
});

const structuredSelector = createStructuredSelector({
  collectibles: accountCollectiblesSelector,
  paymentNetworkBalances: paymentNetworkAccountBalancesSelector,
  activeAccount: activeAccountSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Function) => ({
  fetchInitialAssets: () => dispatch(fetchInitialAssetsAction()),
  updateAssets: (assets: Assets, assetsToExclude: string[]) => dispatch(updateAssetsAction(assets, assetsToExclude)),
  startAssetsSearch: () => dispatch(startAssetsSearchAction()),
  searchAssets: (query: string) => dispatch(searchAssetsAction(query)),
  resetSearchAssetsResult: () => dispatch(resetSearchAssetsResultAction()),
  addAsset: (asset: Asset) => dispatch(addAssetAction(asset)),
  removeAsset: (asset: Asset) => dispatch(removeAssetAction(asset)),
});


export default withNavigation(connect(combinedMapStateToProps, mapDispatchToProps)(WalletView));
