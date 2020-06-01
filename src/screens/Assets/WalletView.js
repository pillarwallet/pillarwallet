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
import isEmpty from 'lodash.isempty';

import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Tabs from 'components/Tabs';
import Insight from 'components/Insight';
import InsightWithButton from 'components/InsightWithButton';
import { Wrapper, ScrollWrapper } from 'components/Layout';
import SearchBlock from 'components/SearchBlock';
import Toast from 'components/Toast';
import { ListItemChevron } from 'components/ListItem/ListItemChevron';
import { LabelBadge } from 'components/LabelBadge';
import SWActivationCard from 'components/SWActivationCard';

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
import { EXCHANGE } from 'constants/navigationConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';

import { activeAccountAddressSelector, activeAccountSelector } from 'selectors';
import { accountBalancesSelector } from 'selectors/balances';
import { accountCollectiblesSelector } from 'selectors/collectibles';
import { accountAssetsSelector } from 'selectors/assets';

import Spinner from 'components/Spinner';
import Separator from 'components/Separator';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Switcher from 'components/Switcher';

import type { Asset, Assets, Balances, Rates } from 'models/Asset';
import type { Collectible } from 'models/Collectible';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts, Account } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { SmartWalletReducerState } from 'reducers/smartWalletReducer';
import type { Theme } from 'models/Theme';

// actions
import {
  searchAssetsAction,
  resetSearchAssetsResultAction,
  addAssetAction,
  fetchAssetsBalancesAction,
} from 'actions/assetsActions';
import { hideAssetAction } from 'actions/userSettingsActions';
import { logScreenViewAction } from 'actions/analyticsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import { dismissSmartWalletInsightAction } from 'actions/insightsActions';

// utils
import { calculateBalanceInFiat } from 'utils/assets';
import { getSmartWalletStatus, getDeploymentData } from 'utils/smartWallet';
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
  hideInsight: () => void,
  insightList: Object[],
  insightsTitle: string,
  assetsSearchResults: Asset[],
  activeAccount: Account,
  searchAssets: (query: string) => void,
  resetSearchAssetsResult: () => void,
  addAsset: (asset: Asset) => void,
  hideAsset: (asset: Asset) => void,
  assetsSearchState: ?string,
  logScreenView: (view: string, screen: string) => void,
  balances: Balances,
  rates: Rates,
  accounts: Accounts,
  smartWalletState: SmartWalletReducerState,
  smartWalletFeatureEnabled: boolean,
  fetchAssetsBalances: () => void,
  fetchAllCollectiblesData: () => void,
  showDeploySmartWallet?: boolean,
  theme: Theme,
  dismissSmartWalletInsight: () => void,
  SWInsightDismissed: boolean,
  onScroll: (event: Object) => void,
  activeAccountAddress: string,
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


const initialSWInsights = [
  'It can be recovered from any web-connected device following proper set up.',
  'It provides access to the Pillar Payment Network including instant and gas-free transactions.',
  'It can control multiple keys providing for dapp-specific usage and spending limits.',
];

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
    this.scrollViewRef = null;
  }

  renderFoundTokensList() {
    const { assets, assetsSearchResults } = this.props;
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
          fallbackToGenericToken
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
        keyboardShouldPersistTaps="always"
      />
    );
  }

  handleSearchChange = (query: string) => {
    const { activeTab } = this.state;
    const formattedQuery = !query ? '' : query.trim();

    this.setState({
      query: formattedQuery,
    });

    if (activeTab === TOKENS) {
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

  shouldBlockAssetsView = () => {
    const { accounts, smartWalletState } = this.props;
    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    const sendingBlockedMessage = smartWalletStatus.sendingBlockedMessage || {};
    const deploymentData = getDeploymentData(smartWalletState);
    return !isEmpty(sendingBlockedMessage)
      && smartWalletStatus.status !== SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED
      && !deploymentData.error;
  };

  isInSearchAndFocus = () => {
    const { hideInsightForSearch } = this.state;
    return hideInsightForSearch || this.isInSearchMode();
  };

  isInSearchMode = () => {
    if (this.state.activeTab === TOKENS) return this.isInAssetSearchMode();
    return this.isInCollectiblesSearchMode();
  };

  isInAssetSearchMode = () => this.state.query.length >= MIN_QUERY_LENGTH && !!this.props.assetsSearchState;

  isInCollectiblesSearchMode = () => this.state.query && this.state.query.length >= MIN_QUERY_LENGTH;

  getFilteredCollectibles = () => {
    const { collectibles } = this.props;
    if (!this.isInCollectiblesSearchMode()) return collectibles;
    return collectibles.filter(({ name }) => name.toUpperCase().includes(this.state.query.toUpperCase()));
  };

  getAssetTab = (id: string, name: string, onPress: () => void) => ({ id, name, onPress });

  getAssetTabs = () => [
    this.getAssetTab(TOKENS, 'Tokens', () => this.setActiveTab(TOKENS)),
    this.getAssetTab(COLLECTIBLES, 'Collectibles', () => this.setActiveTab(COLLECTIBLES)),
  ];

  isAllInsightListDone = () => !this.props.insightList.some(({ status, key }) => !status && key !== 'biometric');

  renderRefreshControl = () => (
    <RefreshControl
      refreshing={false}
      onRefresh={() => {
        this.props.fetchAssetsBalances();
        this.props.fetchAllCollectiblesData();
      }}
    />
  );

  getRefProps = () => Platform.select({
    ios: { innerRef: ref => { this.scrollViewRef = ref; } },
    android: { ref: ref => { this.scrollViewRef = ref; } },
  });

  render() {
    const { query, activeTab } = this.state;
    const {
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
      showDeploySmartWallet,
      theme,
      dismissSmartWalletInsight,
      SWInsightDismissed,
      smartWalletFeatureEnabled,
      onScroll,
      activeAccountAddress,
    } = this.props;
    const colors = getThemeColors(theme);

    // SEARCH
    const isSearchOver = assetsSearchState === FETCHED;
    const isSearching = assetsSearchState === FETCHING && query.length >= MIN_QUERY_LENGTH;
    const inAssetSearchMode = this.isInAssetSearchMode();
    const isInSearchMode = this.isInSearchMode();

    const balance = calculateBalanceInFiat(rates, balances, baseFiatCurrency || defaultFiatCurrency);

    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);

    const hasSmartWallet = smartWalletStatus.hasAccount;
    const showFinishSmartWalletActivation = !hasSmartWallet || showDeploySmartWallet;
    const deploymentData = getDeploymentData(smartWalletState);

    const blockAssetsView = this.shouldBlockAssetsView();

    const isInSearchAndFocus = this.isInSearchAndFocus();
    const isInsightVisible = showInsight && !this.isAllInsightListDone() && !isInSearchAndFocus;
    const searchMarginBottom = isInSearchAndFocus ? 0 : -16;

    const ScrollComponent = Platform.OS === 'ios' ? ScrollWrapper : ScrollView;

    return (
      <ScrollComponent
        stickyHeaderIndices={[1]}
        refreshControl={this.renderRefreshControl()}
        {...this.getRefProps()}
        onScroll={onScroll}
        keyboardShouldPersistTaps="always"
      >
        <>
          <Insight
            isVisible={isInsightVisible}
            title={insightsTitle}
            insightChecklist={insightList}
            onClose={() => { hideInsight(); }}
            wrapperStyle={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
          />
          {smartWalletFeatureEnabled && (blockAssetsView || !!deploymentData.error) &&
            <SWActivationCard />
          }
          {!deploymentData.error && smartWalletFeatureEnabled && !blockAssetsView && !isInSearchAndFocus
          && showDeploySmartWallet && (
            SWInsightDismissed ?
              (
                <SWActivationCard
                  message="To start sending and exchanging assets you need to activate Smart Wallet"
                />
              ) :
              (
                <InsightWithButton
                  title="Welcome to the Pillar Smart Wallet!"
                  description="The Pillar Smart Wallet replaces the existing Pillar Legacy Wallet and
                  features the following benefits:"
                  itemsList={initialSWInsights}
                  buttonTitle="Wow, that's cool"
                  onButtonPress={dismissSmartWalletInsight}
                />
              )
            )
          }
        </>
        {!blockAssetsView &&
        <>
          <SearchBlock
            hideSearch={blockAssetsView}
            searchInputPlaceholder={activeTab === TOKENS ? 'Search asset' : 'Search collectible'}
            onSearchChange={this.handleSearchChange}
            wrapperStyle={{
              paddingHorizontal: spacing.layoutSides,
              paddingVertical: spacing.mediumLarge,
              marginBottom: searchMarginBottom,
            }}
            onSearchFocus={() => this.setState({ hideInsightForSearch: true })}
            onSearchBlur={() => this.setState({ hideInsightForSearch: false })}
            itemSearchState={!!isInSearchMode}
            navigation={navigation}
          />
          {!isInSearchAndFocus &&
            <Tabs
              tabs={this.getAssetTabs()}
              wrapperStyle={{ paddingBottom: 0 }}
              activeTab={activeTab}
            />
          }
        </>
        }
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
              collectibles={this.getFilteredCollectibles()}
              searchQuery={query}
              navigation={navigation}
              activeAccountAddress={activeAccountAddress}
            />)}
          {!isInSearchMode && (!balance || !!showFinishSmartWalletActivation) &&
          <ActionsWrapper>
            {!balance &&
            <ListItemChevron
              label="Buy tokens with credit card"
              onPress={() => navigation.navigate(EXCHANGE, { fromAssetCode: baseFiatCurrency || defaultFiatCurrency })}
              bordered
              addon={(<LabelBadge label="NEW" />)}
            />}
          </ActionsWrapper>}
        </ListWrapper>}
      </ScrollComponent>
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
  insights: { SWInsightDismissed },
}: RootReducerState): $Shape<Props> => ({
  assetsSearchState,
  assetsSearchResults,
  baseFiatCurrency,
  rates,
  accounts,
  smartWalletState,
  smartWalletFeatureEnabled,
  SWInsightDismissed,
});

const structuredSelector = createStructuredSelector({
  collectibles: accountCollectiblesSelector,
  activeAccount: activeAccountSelector,
  activeAccountAddress: activeAccountAddressSelector,
  balances: accountBalancesSelector,
  assets: accountAssetsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  searchAssets: (query: string) => dispatch(searchAssetsAction(query)),
  resetSearchAssetsResult: () => dispatch(resetSearchAssetsResultAction()),
  addAsset: (asset: Asset) => dispatch(addAssetAction(asset)),
  hideAsset: (asset: Asset) => dispatch(hideAssetAction(asset)),
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
  fetchAssetsBalances: () => dispatch(fetchAssetsBalancesAction(true)),
  dismissSmartWalletInsight: () => dispatch(dismissSmartWalletInsightAction()),
});

export default withTheme(withNavigation(connect(combinedMapStateToProps, mapDispatchToProps)(WalletView)));
