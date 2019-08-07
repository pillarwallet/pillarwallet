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
import { Keyboard, Switch, SectionList, Platform, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import styled from 'styled-components/native';
import { SDK_PROVIDER } from 'react-native-dotenv';
import { createStructuredSelector } from 'reselect';
import { withNavigation } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';
import debounce from 'lodash.debounce';
import get from 'lodash.get';

import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import { BaseText, BoldText } from 'components/Typography';
import Tabs from 'components/Tabs';
import { Insight } from 'components/Insight';
import { Wrapper, ScrollWrapper } from 'components/Layout';
import SearchBlock from 'components/SearchBlock';
import Toast from 'components/Toast';
import { ListItemChevron } from 'components/ListItem/ListItemChevron';
import { LabelBadge } from 'components/LabelBadge';

import { baseColors, fontSizes, spacing } from 'utils/variables';

import {
  FETCHED,
  FETCHING,
  TOKENS,
  COLLECTIBLES,
  defaultFiatCurrency,
  ETH,
} from 'constants/assetsConstants';
import { EXCHANGE, SMART_WALLET_INTRO } from 'constants/navigationConstants';
import { SMART_WALLET_DEPLOYMENT_ERRORS } from 'constants/smartWalletConstants';

import { activeAccountSelector } from 'selectors';
import { accountBalancesSelector } from 'selectors/balances';
import { accountCollectiblesSelector } from 'selectors/collectibles';
import Spinner from 'components/Spinner';
import Separator from 'components/Separator';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';

import type { Asset, Assets, Balances, Rates } from 'models/Asset';
import type { Collectible } from 'models/Collectible';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts } from 'models/Account';

// actions
import {
  updateAssetsAction,
  startAssetsSearchAction,
  searchAssetsAction,
  resetSearchAssetsResultAction,
  addAssetAction,
  removeAssetAction,
  fetchAssetsBalancesAction,
} from 'actions/assetsActions';
import { logScreenViewAction } from 'actions/analyticsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import { deploySmartWalletAction } from 'actions/smartWalletActions';

// utils
import { calculatePortfolioBalance } from 'utils/assets';
import { getSmartWalletStatus } from 'utils/smartWallet';

// partials
import CollectiblesList from './CollectiblesList';
import AssetsList from './AssetsList';
import Button from './Assets';

type Props = {
  baseFiatCurrency: string,
  assets: Assets,
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
  logScreenView: Function,
  balances: Balances,
  rates: Rates,
  accounts: Accounts,
  smartWalletState: Object,
  smartWalletFeatureEnabled: boolean,
  fetchAssetsBalances: Function,
  fetchAllCollectiblesData: Function,
  deploySmartWallet: Function,
}

type State = {
  query: string,
  searchScrollTop: number,
  activeTab: string,
  disableScroll: boolean,
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
  flexGrow: 1;
`;

const EmptyStateWrapper = styled(Wrapper)`
  padding-top: 90px;
  padding-bottom: 90px;
  align-items: center;
`;

const ActionsWrapper = styled(Wrapper)`
  margin: 30px 0;
  border-bottom-width: ${StyleSheet.hairlineWidth}px;
  border-top-width: ${StyleSheet.hairlineWidth}px;
  border-color: ${baseColors.mediumLightGray};
`;

const genericToken = require('assets/images/tokens/genericToken.png');

/**
 * due to KeyboardAwareScrollView issues with stickyHeaderIndices on Android
 * separate scrolling wrappers are implemented for iOS and Android
 * (Android natively supports keyboard aware view due to windowSoftInputMode set in AndroidManifest.xml)
 */
const CustomKAWrapper = (props) => {
  const {
    children,
    innerRef,
    disableScroll,
    refreshControl,
  } = props;
  const scrollWrapperProps = {
    stickyHeaderIndices: [2],
    style: { backgroundColor: baseColors.white },
    contentContainerStyle: {
      backgroundColor: baseColors.white,
    },
    refreshControl,
  };

  if (Platform.OS === 'ios') {
    return (
      <ScrollWrapper
        innerRef={innerRef}
        {...scrollWrapperProps}
        scrollEnabled={!disableScroll}
      >
        {children}
      </ScrollWrapper>
    );
  }

  return (
    <ScrollView
      ref={innerRef}
      {...scrollWrapperProps}
      scrollEnabled={!disableScroll}
      style={{ height: '100%' }}
      contentContainerStyle={{ width: '100%' }}
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
      disableScroll: false,
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
    const { logScreenView } = this.props;
    this.setState({ activeTab });
    logScreenView(`View tab Assets.${activeTab}`, 'Assets');
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

  renderBlockedScreen({ title, message }) {
    const { smartWalletState, deploySmartWallet } = this.props;
    let showSpinner = true;
    let showRetryDeploymentButton = false;

    const deploymentData = get(smartWalletState, 'upgrade.deploymentData', {});
    if (deploymentData.error) {
      showSpinner = false;
      showRetryDeploymentButton = true;
      title = 'Smart Wallet deployment failed';
      message = deploymentData.error === SMART_WALLET_DEPLOYMENT_ERRORS.INSUFFICIENT_FUNDS
        ? 'You need to top up your Smart Account first'
        : 'There was an error on our server. Please try to re-deploy the account by clicking the button bellow';
    }

    return (
      <Wrapper flex={1} regularPadding center>
        <MessageTitle>{ title }</MessageTitle>
        <Message>{ message }</Message>
        <Wrapper style={{ marginTop: 20, width: '100%', alignItems: 'center' }}>
          {showSpinner && <Spinner />}
          {showRetryDeploymentButton && <Button
            marginTop="20px"
            height={52}
            title="Retry"
            onPress={() => deploySmartWallet()}
          />}
        </Wrapper>
      </Wrapper>
    );
  }

  render() {
    const {
      query,
      searchScrollTop,
      activeTab,
      disableScroll,
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
      assets,
      rates,
      balances,
      baseFiatCurrency,
      accounts,
      smartWalletState,
      smartWalletFeatureEnabled,
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

    const walletBalances = calculatePortfolioBalance(assets, rates, balances);
    const balance = Object.keys(walletBalances).length ? walletBalances[baseFiatCurrency || defaultFiatCurrency] : 0;
    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    const hasSmartWallet = smartWalletStatus.hasAccount;
    const showFinishSmartWalletActivation = !!smartWalletFeatureEnabled && !hasSmartWallet;

    return (
      <CustomKAWrapper
        innerRef={ref => { this.scrollWrapperRef = ref; }}
        disableScroll={disableScroll}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              const { fetchAssetsBalances, fetchAllCollectiblesData } = this.props;
              if (activeTab === TOKENS) fetchAssetsBalances(assets);
              if (activeTab === COLLECTIBLES) fetchAllCollectiblesData();
            }}
          />
        }
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
          wrapperStyle={{ borderBottomWidth: 1, borderBottomColor: baseColors.mediumLightGray, height: 160 }}
        />
        {blockAssetsView && this.renderBlockedScreen(sendingBlockedMessage)}
        {!blockAssetsView &&
        <SearchBlock
          hideSearch={blockAssetsView}
          searchInputPlaceholder={activeTab === TOKENS ? 'Search asset' : 'Search collectible'}
          onSearchChange={this.handleSearchChange}
          wrapperStyle={{ paddingHorizontal: spacing.large, paddingVertical: spacing.mediumLarge, marginBottom: -16 }}
          onSearchFocus={() => {
            if (this.scrollWrapperRef) {
              if (Platform.OS === 'ios') {
                this.scrollWrapperRef.scrollToPosition(0, searchScrollTop, true);
              } else {
                this.scrollWrapperRef.scrollTo({ x: 0, y: searchScrollTop, animated: true });
              }
            }
            this.setState({ disableScroll: true });
          }}
          onSearchBlur={() => this.setState({ disableScroll: false })}
          itemSearchState={!!isInSearchMode}
          navigation={navigation}
        />}
        {!isInSearchMode && !blockAssetsView && !!collectibles.length &&
        <Tabs
          initialActiveTab={activeTab}
          tabs={assetsTabs}
          wrapperStyle={{ paddingBottom: 0 }}
        />}
        {isSearching &&
        <SearchSpinner center>
          <Spinner />
        </SearchSpinner>
        }
        {!blockAssetsView &&
        <ListWrapper>
          {inAssetSearchMode && isSearchOver &&
            this.renderFoundTokensList()
          }
          {activeTab === TOKENS && !inAssetSearchMode && (
            <AssetsList balance={balance} />
          )}
          {activeTab === COLLECTIBLES && (
            <CollectiblesList
              collectibles={filteredCollectibles}
              searchQuery={query}
              navigation={navigation}
            />)}
          {!isInSearchMode && (!balance || !!showFinishSmartWalletActivation) &&
          <ActionsWrapper>
            {!!showFinishSmartWalletActivation &&
            <ListItemChevron
              label="Finish Smart Wallet activation"
              onPress={() => navigation.navigate(SMART_WALLET_INTRO)}
              bordered
            />}
            {!balance &&
            <ListItemChevron
              label="Buy tokens with credit card"
              onPress={() => navigation.navigate(EXCHANGE, { fromAssetCode: baseFiatCurrency || defaultFiatCurrency })}
              bordered
              addon={(<LabelBadge label="NEW" />)}
            />}
          </ActionsWrapper>}
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
  rates: { data: rates },
  accounts: { data: accounts },
  smartWallet: smartWalletState,
  featureFlags: { data: { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } },
}) => ({
  assets,
  assetsState,
  assetsSearchState,
  assetsSearchResults,
  baseFiatCurrency,
  rates,
  accounts,
  smartWalletState,
  smartWalletFeatureEnabled,
});

const structuredSelector = createStructuredSelector({
  collectibles: accountCollectiblesSelector,
  activeAccount: activeAccountSelector,
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Function) => ({
  updateAssets: (assets: Assets, assetsToExclude: string[]) => dispatch(updateAssetsAction(assets, assetsToExclude)),
  startAssetsSearch: () => dispatch(startAssetsSearchAction()),
  searchAssets: (query: string) => dispatch(searchAssetsAction(query)),
  resetSearchAssetsResult: () => dispatch(resetSearchAssetsResultAction()),
  addAsset: (asset: Asset) => dispatch(addAssetAction(asset)),
  removeAsset: (asset: Asset) => dispatch(removeAssetAction(asset)),
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
  fetchAssetsBalances: (assets) => dispatch(fetchAssetsBalancesAction(assets, true)),
  deploySmartWallet: () => dispatch(deploySmartWalletAction()),
});


export default withNavigation(connect(combinedMapStateToProps, mapDispatchToProps)(WalletView));
