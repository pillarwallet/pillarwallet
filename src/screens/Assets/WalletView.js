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
import { Platform, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import styled, { withTheme } from 'styled-components/native';
import { createStructuredSelector } from 'reselect';
import { withNavigation } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';
import isEmpty from 'lodash.isempty';
import t from 'translations/translate';

import Tabs from 'components/Tabs';
import Insight from 'components/Insight';
import InsightWithButton from 'components/InsightWithButton';
import { Wrapper, ScrollWrapper } from 'components/Layout';
import SearchBlock from 'components/SearchBlock';
import { ListItemChevron } from 'components/ListItem/ListItemChevron';
import { LabelBadge } from 'components/LabelBadge';
import SWActivationCard from 'components/SWActivationCard';

import { spacing } from 'utils/variables';

import { TOKENS, COLLECTIBLES, defaultFiatCurrency } from 'constants/assetsConstants';
import { SERVICES, ASSET_SEARCH } from 'constants/navigationConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';

import { activeAccountAddressSelector } from 'selectors';
import { accountBalancesSelector } from 'selectors/balances';
import { accountCollectiblesSelector } from 'selectors/collectibles';

import type { Balances, Rates } from 'models/Asset';
import type { Collectible } from 'models/Collectible';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { Accounts } from 'models/Account';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { SmartWalletReducerState } from 'reducers/smartWalletReducer';
import type { Theme } from 'models/Theme';

// actions
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
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
  collectibles: Collectible[],
  navigation: NavigationScreenProp<*>,
  tabs: Object[],
  activeTab: string,
  showInsight: boolean,
  hideInsight: () => void,
  insightList: Object[],
  insightsTitle: string,
  logScreenView: (view: string, screen: string) => void,
  balances: Balances,
  rates: Rates,
  accounts: Accounts,
  smartWalletState: SmartWalletReducerState,
  fetchAssetsBalances: () => void,
  fetchAllCollectiblesData: () => void,
  showDeploySmartWallet?: boolean,
  theme: Theme,
  dismissSmartWalletInsight: () => void,
  SWInsightDismissed: boolean,
  onScroll: (event: Object) => void,
  activeAccountAddress: string,
};

type State = {
  query: string,
  activeTab: string,
  hideInsightForSearch: boolean,
};

const MIN_QUERY_LENGTH = 2;

const ListWrapper = styled.View`
  flexGrow: 1;
`;

const ActionsWrapper = styled(Wrapper)`
  margin: 30px 0;
  border-bottom-width: ${StyleSheet.hairlineWidth}px;
  border-top-width: ${StyleSheet.hairlineWidth}px;
  border-color: ${themedColors.border};
`;


class WalletView extends React.Component<Props, State> {
  state = {
    query: '',
    activeTab: TOKENS,
    hideInsightForSearch: false,
  };

  handleSearchChange = (query: string) => {
    const formattedQuery = !query ? '' : query.trim();

    this.setState({
      query: formattedQuery,
    });
  };

  setActiveTab = (activeTab) => {
    const { logScreenView } = this.props;
    this.setState({ activeTab });
    logScreenView(`View tab Assets.${activeTab}`, 'Assets');
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

  isInSearchMode = () => this.state.query && this.state.query.length >= MIN_QUERY_LENGTH;

  getFilteredCollectibles = () => {
    const { collectibles } = this.props;
    if (!this.isInSearchMode()) return collectibles;
    return collectibles.filter(({ name }) => name.toUpperCase().includes(this.state.query.toUpperCase()));
  };

  getAssetTab = (id: string, name: string, onPress: () => void) => ({ id, name, onPress });

  getAssetTabs = () => [
    this.getAssetTab(TOKENS, t('smartWalletContent.tabs.tokens.title'), () => this.setActiveTab(TOKENS)),
    this.getAssetTab(COLLECTIBLES, t('smartWalletContent.tabs.collectibles.title'),
      () => this.setActiveTab(COLLECTIBLES)),
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

  render() {
    const { query, activeTab } = this.state;
    const {
      navigation,
      showInsight,
      hideInsight,
      insightList = [],
      insightsTitle,
      rates,
      balances,
      baseFiatCurrency,
      accounts,
      smartWalletState,
      showDeploySmartWallet,
      theme,
      dismissSmartWalletInsight,
      SWInsightDismissed,
      onScroll,
      activeAccountAddress,
    } = this.props;
    const colors = getThemeColors(theme);

    // SEARCH
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
          {(blockAssetsView || !!deploymentData.error) && <SWActivationCard />}
          {!deploymentData.error && !blockAssetsView && !isInSearchAndFocus && showDeploySmartWallet && (
            SWInsightDismissed ?
              <SWActivationCard message={t('smartWalletContent.activationCard.description.default')} />
              : (
                <InsightWithButton
                  title={t('insight.smartWalletIntro.title')}
                  description={t('insight.smartWalletIntro.description.intro')}
                  itemsList={[
                    t('insight.smartWalletIntro.description.recovery'),
                    t('insight.smartWalletIntro.description.accessToPPN'),
                    t('insight.smartWalletIntro.description.multipleKeys'),
                  ]}
                  buttonTitle={t('insight.smartWalletIntro.button.ok')}
                  onButtonPress={dismissSmartWalletInsight}
                />
              )
            )
          }
        </>
        {!blockAssetsView &&
        <>
          <TouchableOpacity
            onPress={() => this.props.navigation.navigate(ASSET_SEARCH)}
            disabled={activeTab === COLLECTIBLES}
          >
            <SearchBlock
              hideSearch={blockAssetsView}
              searchInputPlaceholder={
                activeTab === TOKENS ? t('label.searchAsset') : t('label.searchCollectible')
              }
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
              disabled={activeTab === TOKENS}
            />
          </TouchableOpacity>
          {!isInSearchAndFocus &&
            <Tabs
              tabs={this.getAssetTabs()}
              wrapperStyle={{ paddingBottom: 0 }}
              activeTab={activeTab}
            />
          }
        </>
        }
        {!blockAssetsView &&
        <ListWrapper>
          {activeTab === TOKENS && (
            <AssetsList balance={balance} />
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
            {!balance && !!activeAccountAddress && (
              <ListItemChevron
                label={t('button.buyTokensWithCreditCard')}
                onPress={() => navigation.navigate(SERVICES)}
                bordered
                addon={(<LabelBadge label={t('badgeText.new')} />)}
              />
            )}
          </ActionsWrapper>}
        </ListWrapper>}
      </ScrollComponent>
    );
  }
}

const mapStateToProps = ({
  appSettings: { data: { baseFiatCurrency } },
  rates: { data: rates },
  accounts: { data: accounts },
  smartWallet: smartWalletState,
  insights: { SWInsightDismissed },
}: RootReducerState): $Shape<Props> => ({
  baseFiatCurrency,
  rates,
  accounts,
  smartWalletState,
  SWInsightDismissed,
});

const structuredSelector = createStructuredSelector({
  collectibles: accountCollectiblesSelector,
  activeAccountAddress: activeAccountAddressSelector,
  balances: accountBalancesSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
  fetchAssetsBalances: () => dispatch(fetchAssetsBalancesAction()),
  dismissSmartWalletInsight: () => dispatch(dismissSmartWalletInsightAction()),
});

export default withTheme(withNavigation(connect(combinedMapStateToProps, mapDispatchToProps)(WalletView)));
