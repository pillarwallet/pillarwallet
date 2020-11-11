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
import { RefreshControl, View, FlatList } from 'react-native';
import { connect } from 'react-redux';
import isEqual from 'lodash.isequal';
import type { NavigationScreenProp, NavigationEventSubscription } from 'react-navigation';
import { createStructuredSelector } from 'reselect';
import Intercom from 'react-native-intercom';
import isEmpty from 'lodash.isempty';
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';

// components
import ActivityFeed from 'components/ActivityFeed';
import styled, { withTheme } from 'styled-components/native';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import BadgeTouchableItem from 'components/BadgeTouchableItem';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import { Banner } from 'components/Banner';
import IconButton from 'components/IconButton';
import CollapsibleSection from 'components/CollapsibleSection';
import ButtonText from 'components/ButtonText';
import Requests from 'screens/WalletConnect/Requests';
import UserNameAndImage from 'components/UserNameAndImage';
import { BaseText } from 'components/Typography';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import SablierStream from 'components/SablierStream';

// constants
import {
  BADGE,
  LENDING_DEPOSITED_ASSETS_LIST,
  LENDING_VIEW_DEPOSITED_ASSET,
  MENU,
  WALLETCONNECT,
  POOLTOGETHER_DASHBOARD,
  SABLIER_STREAMS,
} from 'constants/navigationConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import { DAI } from 'constants/assetsConstants';

// actions
import { fetchSmartWalletTransactionsAction } from 'actions/historyActions';
import { hideHomeUpdateIndicatorAction } from 'actions/notificationsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import { fetchBadgesAction, fetchBadgeAwardHistoryAction } from 'actions/badgesActions';
import { logScreenViewAction } from 'actions/analyticsActions';
import {
  goToInvitationFlowAction,
  fetchReferralRewardsIssuerAddressesAction,
  fetchReferralRewardAction,
} from 'actions/referralsActions';
import {
  toggleBadgesAction,
  toggleLendingDepositsAction,
  togglePoolTogetherAction,
  toggleSablierAction,
} from 'actions/appSettingsActions';
import { checkForMissedAssetsAction, fetchAllAccountsBalancesAction } from 'actions/assetsActions';
import { dismissReferFriendsOnHomeScreenAction } from 'actions/insightsActions';
import { fetchDepositedAssetsAction } from 'actions/lendingActions';
import { fetchAllPoolsPrizes } from 'actions/poolTogetherActions';
import { fetchUserStreamsAction } from 'actions/sablierActions';

// selectors
import { combinedHistorySelector } from 'selectors/history';
import { combinedCollectiblesHistorySelector } from 'selectors/collectibles';
import { poolTogetherUserStatsSelector } from 'selectors/poolTogether';
import { isActiveAccountSmartWalletSelector } from 'selectors/smartWallet';
import { sablierEventsSelector } from 'selectors/sablier';

// utils
import { spacing, fontSizes } from 'utils/variables';
import { getThemeColors } from 'utils/themes';
import { mapTransactionsHistory, mapOpenSeaAndBCXTransactionsHistory } from 'utils/feedData';
import { resetAppNotificationsBadgeNumber } from 'utils/notifications';
import { formatAmountDisplay } from 'utils/common';

// models, types
import type { Account, Accounts } from 'models/Account';
import type { Badges, BadgeRewardEvent } from 'models/Badge';
import type { CallRequest, Connector } from 'models/WalletConnect';
import type { UserEvent } from 'models/userEvent';
import type { Theme } from 'models/Theme';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { User } from 'models/User';
import type { DepositedAsset } from 'models/Asset';
import type { Stream } from 'models/Sablier';

// partials
import WalletsPart from './WalletsPart';


type Props = {
  navigation: NavigationScreenProp<*>,
  user: User,
  fetchSmartWalletTransactions: Function,
  checkForMissedAssets: Function,
  hideHomeUpdateIndicator: () => void,
  intercomNotificationsCount: number,
  fetchAllCollectiblesData: Function,
  openSeaTxHistory: Object[],
  history: Object[],
  badges: Badges,
  fetchBadges: Function,
  pendingConnector: ?Connector,
  logScreenView: (view: string, screen: string) => void,
  activeAccount: ?Account,
  accounts: Accounts,
  userEvents: UserEvent[],
  fetchBadgeAwardHistory: () => void,
  badgesEvents: BadgeRewardEvent[],
  theme: Theme,
  baseFiatCurrency: ?string,
  goToInvitationFlow: () => void,
  hideBadges: boolean,
  hidePoolTogether: boolean,
  toggleBadges: () => void,
  togglePoolTogether: () => void,
  walletConnectRequests: CallRequest[],
  fetchAllAccountsBalances: () => void,
  fetchReferralRewardsIssuerAddresses: () => void,
  fetchReferralReward: () => void,
  isPillarRewardCampaignActive: boolean,
  dismissReferFriends: () => void,
  referFriendsOnHomeScreenDismissed: boolean,
  depositedAssets: DepositedAsset[],
  hideLendingDeposits: boolean,
  fetchDepositedAssets: () => void,
  toggleLendingDeposits: () => void,
  isFetchingDepositedAssets: boolean,
  isFetchingPoolStats: boolean,
  poolTogetherUserStats: Object[],
  fetchPoolStats: () => void,
  isSmartWalletActive: boolean,
  incomingStreams: Stream[],
  outgoingStreams: Stream[],
  isFetchingStreams: boolean,
  toggleSablier: () => void,
  hideSablier: boolean,
  fetchUserStreams: () => void,
  sablierEvents: Object[],
};

const RequestsWrapper = styled.View`
  margin-top: ${({ marginOnTop }) => marginOnTop ? 18 : 2}px;
  align-items: flex-end;
`;

const EmptyStateWrapper = styled.View`
  margin: 20px 0 30px;
`;

const DepositedAssetGain = styled(BaseText)`
  margin-bottom: 5px;
  font-size: ${fontSizes.big};
`;

const referralImage = require('assets/images/referral_gift.png');
const aaveImage = require('assets/images/apps/aave.png');

const poolTogetherLogo = require('assets/images/pool_together.png');
const daiIcon = require('assets/images/dai_color.png');
const usdcIcon = require('assets/images/usdc_color.png');

class HomeScreen extends React.Component<Props> {
  _willFocus: NavigationEventSubscription;
  forceRender = false;

  componentDidMount() {
    const {
      logScreenView,
      fetchBadges,
      fetchBadgeAwardHistory,
      fetchSmartWalletTransactions,
      fetchReferralRewardsIssuerAddresses,
      fetchDepositedAssets,
      isSmartWalletActive,
      fetchPoolStats,
      fetchUserStreams,
    } = this.props;

    logScreenView('View home', 'Home');

    resetAppNotificationsBadgeNumber();

    this._willFocus = this.props.navigation.addListener('willFocus', () => {
      this.props.hideHomeUpdateIndicator();
    });
    if (isSmartWalletActive) {
      fetchPoolStats();
    }
    fetchSmartWalletTransactions();
    fetchBadges();
    fetchBadgeAwardHistory();
    fetchReferralRewardsIssuerAddresses();
    fetchDepositedAssets();
    fetchUserStreams();
  }

  componentWillUnmount() {
    this._willFocus.remove();
  }

  shouldComponentUpdate(nextProps: Props) {
    const isEq = isEqual(this.props, nextProps);
    const isFocused = this.props.navigation.isFocused();

    if (!isFocused) {
      if (!isEq) this.forceRender = true;
      return false;
    }

    if (this.forceRender) {
      this.forceRender = false;
      return true;
    }

    return !isEq;
  }

  refreshScreenData = () => {
    const {
      checkForMissedAssets,
      fetchAllCollectiblesData,
      fetchSmartWalletTransactions,
      fetchBadges,
      fetchBadgeAwardHistory,
      fetchAllAccountsBalances,
      fetchReferralRewardsIssuerAddresses,
      fetchReferralReward,
      fetchDepositedAssets,
      fetchPoolStats,
      isSmartWalletActive,
      fetchUserStreams,
    } = this.props;

    checkForMissedAssets();
    fetchAllCollectiblesData();
    fetchBadges();
    fetchBadgeAwardHistory();
    fetchSmartWalletTransactions();
    fetchAllAccountsBalances();
    fetchReferralRewardsIssuerAddresses();
    fetchReferralReward();
    fetchDepositedAssets();
    if (isSmartWalletActive) {
      fetchPoolStats();
      fetchUserStreams();
    }
  };

  renderBadge = ({ item }) => {
    const { navigation } = this.props;
    return (
      <BadgeTouchableItem
        data={item}
        onPress={() => navigation.navigate(BADGE, { badgeId: item.badgeId })}
        style={{ paddingHorizontal: 8 }}
      />
    );
  };

  renderDepositedAsset = ({ item: depositedAsset }: { item: DepositedAsset }) => {
    const {
      symbol,
      earnInterestRate,
      currentBalance,
      earnedAmount,
      earningsPercentageGain,
      iconUrl,
    } = depositedAsset;
    const cornerIcon = iconUrl ? { uri: `${getEnv().SDK_PROVIDER}/${iconUrl}?size=3` } : '';
    return (
      <ListItemWithImage
        label={t('tokenValue', { value: formatAmountDisplay(currentBalance), token: symbol })}
        subtext={t('aaveContent.label.currentAPYPercentage', { rate: formatAmountDisplay(earnInterestRate) })}
        itemImageSource={aaveImage}
        onPress={() => this.props.navigation.navigate(LENDING_VIEW_DEPOSITED_ASSET, { depositedAsset })}
        iconImageSize={52}
        cornerIcon={cornerIcon}
        rightColumnInnerStyle={{ alignItems: 'flex-end' }}
        itemImageRoundedSquare
      >
        <DepositedAssetGain positive>
          {t('positiveTokenValue', { value: formatAmountDisplay(earnedAmount), token: symbol })}
        </DepositedAssetGain>
        <BaseText secondary>
          {t('positivePercentValue', { value: formatAmountDisplay(earningsPercentageGain) })}
        </BaseText>
      </ListItemWithImage>
    );
  };

  renderPoolTogetherItem = ({ item: poolTogetherStats }: { item: Object }) => {
    const {
      symbol,
      currentPrize,
      winChance,
      remainingTime,
      userTickets,
    } = poolTogetherStats;
    return (
      <ListItemWithImage
        label={t('poolTogetherContent.label.prizeInDollars', { prize: currentPrize })}
        subtext={remainingTime}
        onPress={() => this.props.navigation.navigate(POOLTOGETHER_DASHBOARD, { symbol })}
        iconImageSize={52}
        rightColumnInnerStyle={{ alignItems: 'flex-end' }}
        itemImageSource={poolTogetherLogo}
        cornerIcon={symbol === DAI ? daiIcon : usdcIcon}
        itemImageRoundedSquare
      >
        <BaseText fontSize={fontSizes.big} primary>
          {t('poolTogetherContent.label.ownedTickets', { count: userTickets })}
        </BaseText>
        <BaseText secondary>
          {t('poolTogetherContent.label.winChance', { chancePercent: winChance })}
        </BaseText>
      </ListItemWithImage>
    );
  };

  renderSablierStream = ({ item: stream }) => {
    return <SablierStream stream={stream} />;
  };

  render() {
    const {
      intercomNotificationsCount,
      navigation,
      history,
      openSeaTxHistory,
      badges,
      accounts,
      userEvents,
      badgesEvents,
      theme,
      hideBadges,
      hidePoolTogether,
      toggleBadges,
      togglePoolTogether,
      walletConnectRequests,
      user,
      goToInvitationFlow,
      isPillarRewardCampaignActive,
      dismissReferFriends,
      referFriendsOnHomeScreenDismissed,
      hideLendingDeposits,
      depositedAssets,
      toggleLendingDeposits,
      isFetchingDepositedAssets,
      poolTogetherUserStats = [],
      isFetchingPoolStats,
      isSmartWalletActive,
      incomingStreams,
      outgoingStreams,
      isFetchingStreams,
      toggleSablier,
      hideSablier,
      sablierEvents,
    } = this.props;

    const tokenTxHistory = history
      .filter(({ tranType }) => tranType !== 'collectible')
      .filter(historyItem => historyItem.asset !== 'BTC');
    const bcxCollectiblesTxHistory = history.filter(({ tranType }) => tranType === 'collectible');

    const transactionsOnMainnet = mapTransactionsHistory(
      tokenTxHistory,
      accounts,
      TRANSACTION_EVENT,
      true,
      true,
    );

    const collectiblesTransactions =
      mapOpenSeaAndBCXTransactionsHistory(openSeaTxHistory, bcxCollectiblesTxHistory, true);

    const mappedCTransactions = mapTransactionsHistory(
      collectiblesTransactions,
      accounts,
      COLLECTIBLE_TRANSACTION,
      true,
    );

    const feedData = [
      ...transactionsOnMainnet,
      ...mappedCTransactions,
      ...userEvents,
      ...badgesEvents,
      ...sablierEvents,
    ];

    const hasIntercomNotifications = !!intercomNotificationsCount;

    const badgesContainerStyle = !badges.length ? { width: '100%', justifyContent: 'center' } : {};
    const colors = getThemeColors(theme);
    const referralBannerText = isPillarRewardCampaignActive
      ? t('referralsContent.label.referAndGetRewards')
      : t('referralsContent.label.inviteFriends');

    const hasPoolTickets = poolTogetherUserStats.some(({ userTickets }) => userTickets > 0);

    const latestIncomingStream = incomingStreams.sort((a, b) => (+b.startTime) - (+a.startTime))[0];
    const latestOutgoingStream = outgoingStreams.sort((a, b) => (+b.startTime) - (+a.startTime))[0];
    const streams = [latestOutgoingStream, latestIncomingStream].filter(stream => !!stream);
    const hasStreams = !!streams.length;

    return (
      <React.Fragment>
        <ContainerWithHeader
          headerProps={{
            leftItems: [
              {
                custom: (
                  <IconButton
                    icon="hamburger"
                    onPress={() => navigation.navigate(MENU)}
                    fontSize={fontSizes.large}
                    secondary
                    style={{
                      width: 40,
                      height: 40,
                      marginLeft: -10,
                      marginTop: -6,
                    }}
                  />
                ),
              },
            ],
            centerItems: [{ custom: <UserNameAndImage user={user} /> }],
            rightItems: [
              {
                link: t('button.support'),
                onPress: () => Intercom.displayMessenger(),
                addon: hasIntercomNotifications && (
                  <View
                    style={{
                      width: 8,
                      height: 8,
                      backgroundColor: colors.indicator,
                      borderRadius: 4,
                      marginLeft: 4,
                      marginRight: -6,
                    }}
                  />
                ),
              },
            ],
            sideFlex: '25px',
          }}
          inset={{ bottom: 0 }}
          tab
        >
          {onScroll => (
            <ActivityFeed
              card
              cardHeaderTitle={t('title.mainActivityFeed')}
              navigation={navigation}
              feedData={feedData}
              initialNumToRender={8}
              wrapperStyle={{ flexGrow: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              isForAllAccounts
              headerComponent={(
                <React.Fragment>
                  <WalletsPart rewardActive={isPillarRewardCampaignActive} />
                  {!!walletConnectRequests &&
                  <RequestsWrapper marginOnTop={walletConnectRequests.length === 1}>
                    {walletConnectRequests.length > 1 &&
                    <ButtonText
                      onPress={() => navigation.navigate(WALLETCONNECT)}
                      buttonText={t('button.viewAllItemsAmount', { amount: walletConnectRequests.length })}
                      wrapperStyle={{ padding: spacing.layoutSides, alignSelf: 'flex-end' }}
                    />}
                    <Requests showLastOneOnly />
                  </RequestsWrapper>}
                  <Banner
                    isVisible={!referFriendsOnHomeScreenDismissed}
                    onPress={goToInvitationFlow}
                    bannerText={referralBannerText}
                    imageProps={{
                      style: {
                        width: 96,
                        height: 60,
                        marginRight: -4,
                        marginTop: 15,
                      },
                      source: referralImage,
                    }}
                    onClose={dismissReferFriends}
                  />
                  <CollapsibleSection
                    label={t('badgesContent.badgesList.title')}
                    collapseContent={
                      <FlatList
                        data={badges}
                        horizontal
                        keyExtractor={(item) => (item.id.toString())}
                        renderItem={this.renderBadge}
                        style={{ width: '100%', paddingBottom: spacing.medium }}
                        contentContainerStyle={{ paddingHorizontal: 2, paddingTop: 26, ...badgesContainerStyle }}
                        initialNumToRender={5}
                        ListEmptyComponent={(
                          <EmptyStateWrapper>
                            <EmptyStateParagraph
                              title={t('badgesContent.badgesList.emptyState.noBadges.title')}
                              bodyText={t('badgesContent.badgesList.emptyState.noBadges.paragraph')}
                            />
                          </EmptyStateWrapper>
                        )}
                      />
                    }
                    onPress={toggleBadges}
                    open={!hideBadges}
                  />
                  {!isEmpty(depositedAssets) &&
                    <CollapsibleSection
                      label={t('aaveContent.depositedAssetsList.title')}
                      labelRight={isFetchingDepositedAssets ? null : t('button.viewAll')}
                      showLoadingSpinner={isFetchingDepositedAssets}
                      onPressLabelRight={() => navigation.navigate(LENDING_DEPOSITED_ASSETS_LIST)}
                      collapseContent={
                        <FlatList
                          data={depositedAssets}
                          keyExtractor={(item) => item.symbol}
                          renderItem={this.renderDepositedAsset}
                          initialNumToRender={5}
                          listKey="aave_deposits"
                        />
                      }
                      onPress={toggleLendingDeposits}
                      open={!hideLendingDeposits}
                    />
                  }
                  {!!hasPoolTickets && !!isSmartWalletActive &&
                  <CollapsibleSection
                    label={t('poolTogetherContent.ticketsList.title')}
                    showLoadingSpinner={isFetchingPoolStats}
                    collapseContent={
                      <FlatList
                        data={poolTogetherUserStats}
                        keyExtractor={(item) => item.symbol}
                        renderItem={this.renderPoolTogetherItem}
                        listKey="pool_together"
                      />
                    }
                    onPress={togglePoolTogether}
                    open={!hidePoolTogether}
                  />
                  }
                  {!!hasStreams && !!isSmartWalletActive &&
                    <CollapsibleSection
                      label={t('sablierContent.moneyStreamingList.title')}
                      showLoadingSpinner={isFetchingStreams}
                      labelRight={isFetchingStreams ? null : t('button.viewAll')}
                      onPressLabelRight={() => navigation.navigate(SABLIER_STREAMS)}
                      collapseContent={
                        <FlatList
                          data={streams}
                          keyExtractor={(item) => item.id}
                          renderItem={this.renderSablierStream}
                          initialNumToRender={2}
                          listKey="sablier"
                        />
                      }
                      onPress={toggleSablier}
                      open={!hideSablier}
                    />
                  }
                </React.Fragment>
              )}
              flatListProps={{
                refreshControl: (
                  <RefreshControl
                    refreshing={false}
                    onRefresh={this.refreshScreenData}
                  />
                ),
                onScroll,
                scrollEventThrottle: 16,
              }}
            />
          )}
        </ContainerWithHeader>
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({
  user: { data: user },
  notifications: { intercomNotificationsCount },
  badges: { data: badges, badgesEvents },
  accounts: { data: accounts },
  userEvents: { data: userEvents },
  appSettings: {
    data: {
      baseFiatCurrency, hideBadges, hideLendingDeposits, hidePoolTogether, hideSablier,
    },
  },
  walletConnect: { requests: walletConnectRequests },
  referrals: { isPillarRewardCampaignActive },
  insights: { referFriendsOnHomeScreenDismissed },
  lending: { depositedAssets, isFetchingDepositedAssets },
  poolTogether: { isFetchingPoolStats },
  sablier: { incomingStreams, outgoingStreams, isFetchingStreams },
}: RootReducerState): $Shape<Props> => ({
  user,
  intercomNotificationsCount,
  badges,
  badgesEvents,
  accounts,
  userEvents,
  baseFiatCurrency,
  hideBadges,
  hidePoolTogether,
  hideSablier,
  walletConnectRequests,
  isPillarRewardCampaignActive,
  referFriendsOnHomeScreenDismissed,
  hideLendingDeposits,
  depositedAssets,
  isFetchingDepositedAssets,
  isFetchingPoolStats,
  incomingStreams,
  outgoingStreams,
  isFetchingStreams,
});

const structuredSelector = createStructuredSelector({
  history: combinedHistorySelector,
  openSeaTxHistory: combinedCollectiblesHistorySelector,
  poolTogetherUserStats: poolTogetherUserStatsSelector,
  isSmartWalletActive: isActiveAccountSmartWalletSelector,
  sablierEvents: sablierEventsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchSmartWalletTransactions: () => dispatch(fetchSmartWalletTransactionsAction()),
  checkForMissedAssets: () => dispatch(checkForMissedAssetsAction()),
  hideHomeUpdateIndicator: () => dispatch(hideHomeUpdateIndicatorAction()),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
  fetchBadges: () => dispatch(fetchBadgesAction()),
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  fetchBadgeAwardHistory: () => dispatch(fetchBadgeAwardHistoryAction()),
  goToInvitationFlow: () => dispatch(goToInvitationFlowAction()),
  toggleBadges: () => dispatch(toggleBadgesAction()),
  togglePoolTogether: () => dispatch(togglePoolTogetherAction()),
  fetchAllAccountsBalances: () => dispatch(fetchAllAccountsBalancesAction()),
  fetchReferralRewardsIssuerAddresses: () => dispatch(fetchReferralRewardsIssuerAddressesAction()),
  fetchReferralReward: () => dispatch(fetchReferralRewardAction()),
  dismissReferFriends: () => dispatch(dismissReferFriendsOnHomeScreenAction()),
  fetchDepositedAssets: () => dispatch(fetchDepositedAssetsAction()),
  toggleLendingDeposits: () => dispatch(toggleLendingDepositsAction()),
  fetchPoolStats: () => dispatch(fetchAllPoolsPrizes()),
  fetchUserStreams: () => dispatch(fetchUserStreamsAction()),
  toggleSablier: () => dispatch(toggleSablierAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(HomeScreen));
