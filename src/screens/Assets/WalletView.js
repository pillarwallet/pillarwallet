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
import { Keyboard, SectionList, Platform, ScrollView, StyleSheet, RefreshControl, Alert } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import { SDK_PROVIDER } from 'react-native-dotenv';
import { createStructuredSelector } from 'reselect';
import { withNavigation } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';
import debounce from 'lodash.debounce';
import get from 'lodash.get';

import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Tabs from 'components/Tabs';
import Insight from 'components/Insight';
import { Wrapper, ScrollWrapper } from 'components/Layout';
import SearchBlock from 'components/SearchBlock';
import Toast from 'components/Toast';
import { ListItemChevron } from 'components/ListItem/ListItemChevron';
import { LabelBadge } from 'components/LabelBadge';

import { spacing } from 'utils/variables';

import {
  FETCHED,
  FETCHING,
  TOKENS,
  COLLECTIBLES,
  defaultFiatCurrency,
  ETH,
  PLR,
} from 'constants/assetsConstants';
import { EXCHANGE, SMART_WALLET_INTRO } from 'constants/navigationConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';

import { activeAccountSelector } from 'selectors';
import { accountBalancesSelector } from 'selectors/balances';
import { accountCollectiblesSelector } from 'selectors/collectibles';
import { accountAssetsSelector } from 'selectors/assets';

import Spinner from 'components/Spinner';
import Separator from 'components/Separator';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import DeploymentView from 'components/DeploymentView';
import Switcher from 'components/Switcher';

import type { Asset, Assets, Balances, Rates } from 'models/Asset';
import type { Collectible } from 'models/Collectible';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';

// actions
import {
  startAssetsSearchAction,
  searchAssetsAction,
  resetSearchAssetsResultAction,
  addAssetAction,
  fetchAssetsBalancesAction,
} from 'actions/assetsActions';
import { hideAssetAction } from 'actions/userSettingsActions';
import { logScreenViewAction } from 'actions/analyticsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import { deploySmartWalletAction } from 'actions/smartWalletActions';

// utils
import { calculateBalanceInFiat } from 'utils/assets';
import { getSmartWalletStatus, getDeployErrorMessage } from 'utils/smartWallet';
import { getThemeColors, themedColors } from 'utils/themes';

// partials
import CollectiblesList from './CollectiblesList';
import AssetsList from './AssetsList';

type Props = {
  baseFiatCurrency: ?string,
  assets: Assets,
  collectibles: Collectible[],
  navigation: NavigationScreenProp<*>,
  tabs: Object[],
  activeTab: string,
  showInsight: boolean,
  hideInsight: Function,
  insightList: Object[],
  insightsTitle: string,
  assetsSearchResults: Asset[],
  activeAccount: Object,
  startAssetsSearch: Function,
  searchAssets: Function,
  resetSearchAssetsResult: Function,
  addAsset: Function,
  hideAsset: Function,
  assetsSearchState: ?string,
  logScreenView: Function,
  balances: Balances,
  rates: Rates,
  accounts: Accounts,
  smartWalletState: Object,
  smartWalletFeatureEnabled: boolean,
  fetchAssetsBalances: Function,
  fetchAllCollectiblesData: Function,
  deploySmartWallet: Function,
  showDeploySmartWallet?: boolean,
  theme: Theme,
}

type State = {
  query: string,
  activeTab: string,
  hideInsightForSearch: boolean,
}

const MIN_QUERY_LENGTH = 2;

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
  border-color: ${themedColors.border};
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
    refreshControl,
    hasStickyTabs,
    getRef,
  } = props;
  const scrollWrapperProps = {
    stickyHeaderIndices: hasStickyTabs ? [2] : [0],
    refreshControl,
    onScroll: () => Keyboard.dismiss(),
  };

  if (Platform.OS === 'ios') {
    return (
      <ScrollWrapper
        {...scrollWrapperProps}
        innerRef={ref => getRef(ref)}
      >
        {children}
      </ScrollWrapper>
    );
  }

  return (
    <ScrollView
      {...scrollWrapperProps}
      style={{ height: '100%' }}
      contentContainerStyle={{ width: '100%' }}
      ref={(ref) => getRef(ref)}
    >
      {children}
    </ScrollView>
  );
};

class WalletView extends React.Component<Props, State> {
  scrollViewRef: ?Object;

  constructor(props: Props) {
    super(props);
    this.state = {
      query: '',
      activeTab: TOKENS,
      hideInsightForSearch: false,
    };
    this.doAssetsSearch = debounce(this.doAssetsSearch, 500);
    this.scrollViewRef = React.createRef();
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
          <Switcher
            onToggle={() => this.handleAssetToggle(asset, isAdded)}
            isOn={!!isAdded}
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
  };

  hideTokenFromWallet = (asset: Asset) => {
    const {
      hideAsset,
    } = this.props;

    if (asset.symbol === ETH || asset.symbol === PLR) {
      this.showNotHiddenNotification(asset);
      return;
    }

    Alert.alert(
      'Are you sure?',
      `This will hide ${asset.name} from your wallet`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Hide', onPress: () => hideAsset(asset) },
      ],
    );
  };

  showNotHiddenNotification = (asset) => {
    Toast.show({
      message: `${asset.name} is essential for Pillar wallet`,
      type: 'info',
      title: 'This asset cannot be switched off',
    });
  };

  render() {
    const {
      query,
      activeTab,
      hideInsightForSearch,
    } = this.state;
    const {
      collectibles,
      navigation,
      showInsight,
      hideInsight,
      insightList = [],
      insightsTitle,
      assetsSearchState,
      rates,
      balances,
      baseFiatCurrency,
      accounts,
      smartWalletState,
      smartWalletFeatureEnabled,
      showDeploySmartWallet,
      deploySmartWallet,
      fetchAssetsBalances,
      fetchAllCollectiblesData,
      theme,
    } = this.props;
    const colors = getThemeColors(theme);

    // SEARCH
    const isSearchOver = assetsSearchState === FETCHED;
    const isSearching = assetsSearchState === FETCHING && query.length >= MIN_QUERY_LENGTH;
    const inAssetSearchMode = (query.length >= MIN_QUERY_LENGTH && !!assetsSearchState);
    const isInCollectiblesSearchMode = !!query && query.length >= MIN_QUERY_LENGTH;
    const isInSearchMode = activeTab === TOKENS ? inAssetSearchMode : isInCollectiblesSearchMode;

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

    const balance = calculateBalanceInFiat(rates, balances, baseFiatCurrency || defaultFiatCurrency);

    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);

    const hasSmartWallet = smartWalletStatus.hasAccount;
    const showFinishSmartWalletActivation = !hasSmartWallet || showDeploySmartWallet;
    const deploymentData = get(smartWalletState, 'upgrade.deploymentData', {});

    const sendingBlockedMessage = smartWalletStatus.sendingBlockedMessage || {};
    const blockAssetsView = !!Object.keys(sendingBlockedMessage).length
      && smartWalletStatus.status !== SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED;
    const isAllInsightListDone = !insightList.some(({ status, key }) => !status && key !== 'biometric');

    const isInSearchAndFocus = hideInsightForSearch || isInSearchMode;
    const isInsightVisible = showInsight && !isAllInsightListDone && !isInSearchAndFocus;
    const searchMarginBottom = isInSearchAndFocus ? 0 : -16;
    let smartWalletDeployLabel = '';
    if (!hasSmartWallet) {
      smartWalletDeployLabel = 'Create Smart Wallet';
    } else {
      smartWalletDeployLabel = (showDeploySmartWallet) ? 'Deploy Smart Wallet' : 'Finish Smart Wallet activation';
    }
    return (
      <CustomKAWrapper
        hasStickyTabs={!isInSearchAndFocus && !blockAssetsView}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {
              fetchAssetsBalances();
              fetchAllCollectiblesData();
            }}
          />
        }
        getRef={(ref) => { this.scrollViewRef = ref; }}
      >
        <Insight
          isVisible={isInsightVisible}
          title={insightsTitle}
          insightChecklist={insightList}
          onClose={() => { hideInsight(); }}
          wrapperStyle={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        />
        {blockAssetsView &&
        <DeploymentView
          message={deploymentData.error ? getDeployErrorMessage(deploymentData.error) : sendingBlockedMessage}
          buttonAction={deploymentData.error ? () => deploySmartWallet() : null}
          buttonLabel="Retry"
          forceRetry={!!deploymentData.error}
        />}
        {!blockAssetsView &&
        <SearchBlock
          hideSearch={blockAssetsView}
          searchInputPlaceholder={activeTab === TOKENS ? 'Search asset' : 'Search collectible'}
          onSearchChange={this.handleSearchChange}
          wrapperStyle={{
            paddingHorizontal: spacing.layoutSides,
            paddingVertical: spacing.mediumLarge,
            marginBottom: searchMarginBottom,
          }}
          onSearchFocus={() => {
            this.setState({ hideInsightForSearch: true });
          }}
          onSearchBlur={() => this.setState({ hideInsightForSearch: false })}
          itemSearchState={!!isInSearchMode}
          navigation={navigation}
        />}
        {!isInSearchAndFocus && !blockAssetsView &&
        <Tabs
          tabs={assetsTabs}
          wrapperStyle={{ paddingBottom: 0 }}
          activeTab={activeTab}
        />}
        {isSearching &&
        <SearchSpinner center>
          <Spinner />
        </SearchSpinner>
        }
        {!blockAssetsView &&
        <ListWrapper>
          {inAssetSearchMode && isSearchOver && activeTab === TOKENS &&
            this.renderFoundTokensList()
          }
          {activeTab === TOKENS && !inAssetSearchMode && (
            <AssetsList balance={balance} scrollViewRef={this.scrollViewRef} />
          )}
          {activeTab === COLLECTIBLES && (
            <CollectiblesList
              collectibles={filteredCollectibles}
              searchQuery={query}
              navigation={navigation}
            />)}
          {!isInSearchMode && (!balance || !!showFinishSmartWalletActivation) &&
          <ActionsWrapper>
            {!!showFinishSmartWalletActivation && smartWalletFeatureEnabled &&
            <ListItemChevron
              label={smartWalletDeployLabel}
              onPress={() => navigation.navigate(SMART_WALLET_INTRO, { deploy: showDeploySmartWallet })}
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
    assetsSearchState,
    assetsSearchResults,
  },
  appSettings: { data: { baseFiatCurrency } },
  rates: { data: rates },
  accounts: { data: accounts },
  smartWallet: smartWalletState,
  featureFlags: { data: { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } },
}: RootReducerState): $Shape<Props> => ({
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
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  startAssetsSearch: () => dispatch(startAssetsSearchAction()),
  searchAssets: (query: string) => dispatch(searchAssetsAction(query)),
  resetSearchAssetsResult: () => dispatch(resetSearchAssetsResultAction()),
  addAsset: (asset: Asset) => dispatch(addAssetAction(asset)),
  hideAsset: (asset: Asset) => dispatch(hideAssetAction(asset)),
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
  fetchAssetsBalances: () => dispatch(fetchAssetsBalancesAction(true)),
  deploySmartWallet: () => dispatch(deploySmartWalletAction()),
});

export default withTheme(withNavigation(connect(combinedMapStateToProps, mapDispatchToProps)(WalletView)));
