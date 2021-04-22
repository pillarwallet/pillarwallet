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
import { useNavigation } from 'react-navigation-hooks';
import { useDispatch } from 'react-redux';
import { Platform, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import isEmpty from 'lodash.isempty';
import t from 'translations/translate';

// Components
import { Wrapper, ScrollWrapper } from 'components/Layout';
import Tabs from 'components/Tabs';
import InsightWithButton from 'components/InsightWithButton';
import SearchBlock from 'components/SearchBlock';
import { ListItemChevron } from 'components/ListItem/ListItemChevron';
import { LabelBadge } from 'components/LabelBadge';
import SWActivationCard from 'components/SWActivationCard';
import CollectiblesList from 'components/CollectiblesList';

// Constants
import { TOKENS, COLLECTIBLES, defaultFiatCurrency } from 'constants/assetsConstants';
import { SERVICES, ASSET_SEARCH, COLLECTIBLE } from 'constants/navigationConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';

// Selectors
import { useRootSelector, useRates, useFiatCurrency, activeAccountAddressSelector } from 'selectors';
import { accountBalancesSelector } from 'selectors/balances';
import { accountCollectiblesSelector } from 'selectors/collectibles';

// Actions
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import { dismissSmartWalletInsightAction } from 'actions/insightsActions';

// Utils
import { getTotalBalanceInFiat } from 'utils/assets';
import { getSmartWalletStatus, getDeploymentData } from 'utils/smartWallet';
import { getColorByTheme } from 'utils/themes';

// Types
import type { Collectible } from 'models/Collectible';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';

// Local
import AssetsList from './AssetsList';

type Props = {
  showDeploySmartWallet?: boolean,
  onScroll: (event: Object) => void,
};

const MIN_QUERY_LENGTH = 2;

function LegacyWalletView({
  showDeploySmartWallet,
  onScroll,
}: Props) {
  const navigation = useNavigation();

  const [query, setQuery] = React.useState('');
  const [activeTab, setActiveTab] = React.useState(TOKENS);
  const [hideInsightForSearch, setHideInsightForSearch] = React.useState(false);

  const baseFiatCurrency = useFiatCurrency();
  const rates = useRates();
  const accounts = useRootSelector((root) => root.accounts.data);
  const smartWalletState = useRootSelector((root) => root.smartWallet);
  const SWInsightDismissed = useRootSelector((root) => root.insights.SWInsightDismissed);
  const collectibles = useRootSelector(accountCollectiblesSelector);
  const activeAccountAddress = useRootSelector(activeAccountAddressSelector);
  const balances = useRootSelector(accountBalancesSelector);

  const dispatch = useDispatch();

  const handleSearchChange = (value: string) => {
    setQuery(!value ? '' : value.trim());
  };

  const shouldBlockAssetsView = () => {
    const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    const sendingBlockedMessage = smartWalletStatus.sendingBlockedMessage || {};
    const deploymentData = getDeploymentData(smartWalletState);
    return (
      !isEmpty(sendingBlockedMessage) &&
      smartWalletStatus.status !== SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED &&
      !deploymentData.error
    );
  };

  const isInSearchAndFocusFn = () => {
    return hideInsightForSearch || isInSearchModeFn();
  };

  const isInSearchModeFn = () => query && query.length >= MIN_QUERY_LENGTH;

  const getFilteredCollectibles = () => {
    if (!isInSearchModeFn()) return collectibles;
    return collectibles.filter(({ name }) => name.toUpperCase().includes(query.toUpperCase()));
  };

  const getAssetTab = (id: string, name: string, onPress: () => void) => ({ id, name, onPress });

  const getAssetTabs = () => [
    getAssetTab(TOKENS, t('smartWalletContent.tabs.tokens.title'), () => setActiveTab(TOKENS)),
    getAssetTab(COLLECTIBLES, t('smartWalletContent.tabs.collectibles.title'), () => setActiveTab(COLLECTIBLES)),
  ];

  const renderRefreshControl = () => (
    <RefreshControl
      refreshing={false}
      onRefresh={() => {
        dispatch(fetchAssetsBalancesAction());
        dispatch(fetchAllCollectiblesDataAction());
      }}
    />
  );

  const handleCollectiblePress = (collectible: Collectible) => {
    navigation.navigate(COLLECTIBLE, { assetData: collectible });
  };

  // SEARCH
  const isInSearchMode = isInSearchModeFn();

  const balance = getTotalBalanceInFiat(balances, rates, baseFiatCurrency || defaultFiatCurrency);

  const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);

  const hasSmartWallet = smartWalletStatus.hasAccount;
  const showFinishSmartWalletActivation = !hasSmartWallet || showDeploySmartWallet;
  const deploymentData = getDeploymentData(smartWalletState);

  const blockAssetsView = shouldBlockAssetsView();

  const isInSearchAndFocus = isInSearchAndFocusFn();
  const searchMarginBottom = isInSearchAndFocus ? 0 : -16;

  const ScrollComponent = Platform.OS === 'ios' ? ScrollWrapper : ScrollView;

  const renderMainContent = () => {
    return (
      <>
        <TopWrapper>
          <TouchableOpacity onPress={() => navigation.navigate(ASSET_SEARCH)} disabled={activeTab === COLLECTIBLES}>
            <SearchBlock
              hideSearch={blockAssetsView}
              searchInputPlaceholder={activeTab === TOKENS ? t('label.searchAsset') : t('label.searchCollectible')}
              onSearchChange={handleSearchChange}
              wrapperStyle={{
                marginBottom: searchMarginBottom,
              }}
              onSearchFocus={() => setHideInsightForSearch(true)}
              onSearchBlur={() => setHideInsightForSearch(false)}
              itemSearchState={!!isInSearchMode}
              navigation={navigation}
              disabled={activeTab === TOKENS}
            />
          </TouchableOpacity>

          {!isInSearchAndFocus && (
            <Tabs tabs={getAssetTabs()} wrapperStyle={{ paddingTop: 22 }} activeTab={activeTab} />
          )}
        </TopWrapper>

        <ListWrapper>
          {activeTab === TOKENS && <AssetsList balance={balance} />}
          {activeTab === COLLECTIBLES && (
            <CollectiblesList
              collectibles={getFilteredCollectibles()}
              onCollectiblePress={handleCollectiblePress}
              isSearching={query.length >= MIN_QUERY_LENGTH}
            />
          )}
          {!isInSearchMode && (!balance || !!showFinishSmartWalletActivation) && (
            <ActionsWrapper>
              {!balance && !!activeAccountAddress && (
                <ListItemChevron
                  label={t('button.buyTokensWithCreditCard')}
                  onPress={() => {
                    navigation.navigate(SERVICES);
                  }}
                  bordered
                  addon={<LabelBadge label={t('badgeText.new')} />}
                />
              )}
            </ActionsWrapper>
          )}
        </ListWrapper>
      </>
    );
  };

  return (
    <ScrollComponent
      stickyHeaderIndices={[1]}
      refreshControl={renderRefreshControl()}
      onScroll={onScroll}
      keyboardShouldPersistTaps="always"
    >
      <>
        {(blockAssetsView || !!deploymentData.error) && <SWActivationCard />}

        {!deploymentData.error &&
          !blockAssetsView &&
          !isInSearchAndFocus &&
          showDeploySmartWallet &&
          (SWInsightDismissed ? (
            <SWActivationCard message={t('smartWalletContent.activationCard.description.default')} />
          ) : (
            <InsightWithButton
              title={t('insight.smartWalletIntro.title')}
              description={t('insight.smartWalletIntro.description.intro')}
              itemsList={[
                t('insight.smartWalletIntro.description.recovery'),
                t('insight.smartWalletIntro.description.accessToPPN'),
                t('insight.smartWalletIntro.description.multipleKeys'),
              ]}
              buttonTitle={t('insight.smartWalletIntro.button.ok')}
              onButtonPress={() => dispatch(dismissSmartWalletInsightAction())}
            />
          ))}

        {!blockAssetsView && renderMainContent()}
      </>
    </ScrollComponent>
  );
}

export default LegacyWalletView;

const ListWrapper = styled.View`
  flex-grow: 1;
`;

const TopWrapper = styled.View`
  background-color: ${({ theme }) => theme.colors.basic070};
  margin-bottom: 8px;
`;

const ActionsWrapper = styled(Wrapper)`
  margin: 30px 0;
  border-bottom-width: ${StyleSheet.hairlineWidth}px;
  border-top-width: ${StyleSheet.hairlineWidth}px;
  border-color: ${getColorByTheme({ lightKey: 'basic060', darkKey: 'basic080' })};
`;
