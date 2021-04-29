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
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';
import styled, { withTheme } from 'styled-components/native';

// components
import ActivityFeed from 'components/ActivityFeed';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import BadgeTouchableItem from 'components/BadgeTouchableItem';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Banner from 'components/Banner';
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
  MENU,
  WALLETCONNECT,
  POOLTOGETHER_DASHBOARD,
  SABLIER_STREAMS,
  RARI_DEPOSIT,
  LIQUIDITY_POOLS as LIQUIDITY_POOLS_SCREEN,
  LIQUIDITY_POOL_DASHBOARD,
} from 'constants/navigationConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import { DAI, defaultFiatCurrency } from 'constants/assetsConstants';
import { STAGING } from 'constants/envConstants';
import { LIQUIDITY_POOLS } from 'constants/liquidityPoolsConstants';

// actions
import { fetchTransactionsHistoryAction } from 'actions/historyActions';
import { hideHomeUpdateIndicatorAction } from 'actions/notificationsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import { fetchBadgesAction, fetchBadgeAwardHistoryAction } from 'actions/badgesActions';
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
  toggleRariAction,
  toggleLiquidityPoolsAction,
} from 'actions/appSettingsActions';
import { checkForMissedAssetsAction, fetchAllAccountsBalancesAction } from 'actions/assetsActions';
import { dismissReferFriendsOnHomeScreenAction } from 'actions/insightsActions';
import { fetchDepositedAssetsAction } from 'actions/lendingActions';
import { fetchAllPoolsPrizes } from 'actions/poolTogetherActions';
import { fetchUserStreamsAction } from 'actions/sablierActions';
import { fetchRariDataAction } from 'actions/rariActions';
import { fetchLiquidityPoolsDataAction } from 'actions/liquidityPoolsActions';
import { checkArchanovaSessionIfNeededAction } from 'actions/smartWalletActions';

// selectors
import { combinedHistorySelector } from 'selectors/history';
import { combinedCollectiblesHistorySelector } from 'selectors/collectibles';
import { poolTogetherUserStatsSelector } from 'selectors/poolTogether';
import { sablierEventsSelector } from 'selectors/sablier';

// utils
import { spacing, fontSizes } from 'utils/variables';
import { getThemeColors } from 'utils/themes';
import { mapTransactionsHistory, mapOpenSeaAndBCXTransactionsHistory } from 'utils/feedData';
import { resetAppNotificationsBadgeNumber } from 'utils/notifications';
import { formatAmountDisplay, formatFiat } from 'utils/common';
import { getPoolStats } from 'utils/liquidityPools';
import { convertUSDToFiat } from 'utils/assets';
import { isArchanovaAccount } from 'utils/accounts';

// models, types
import type { Account, Accounts } from 'models/Account';
import type { Badges, BadgeRewardEvent } from 'models/Badge';
import type { CallRequest, Connector } from 'models/WalletConnect';
import type { UserEvent } from 'models/userEvent';
import type { Theme } from 'models/Theme';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { User } from 'models/User';
import type { DepositedAsset, Rates } from 'models/Asset';
import type { Stream } from 'models/Sablier';
import type { RariPool } from 'models/RariPool';
import type { LiquidityPoolsReducerState } from 'reducers/liquidityPoolsReducer';
import type { LiquidityPool } from 'models/LiquidityPools';

// partials
import WalletsPart from './WalletsPart';
import DepositedAssets from './DepositedAssets';
import RariPoolItem from './RariPoolItem';


type Props = {
  navigation: NavigationScreenProp<*>,
  user: User,
  fetchTransactionsHistory: Function,
  checkForMissedAssets: Function,
  hideHomeUpdateIndicator: () => void,
  intercomNotificationsCount: number,
  fetchAllCollectiblesData: Function,
  openSeaTxHistory: Object[],
  history: Object[],
  badges: Badges,
  fetchBadges: Function,
  pendingConnector: ?Connector,
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
  incomingStreams: Stream[],
  outgoingStreams: Stream[],
  isFetchingStreams: boolean,
  toggleSablier: () => void,
  hideSablier: boolean,
  fetchUserStreams: () => void,
  sablierEvents: Object[],
  toggleRari: () => void,
  hideRari: boolean,
  isFetchingRariData: boolean,
  rariUserDepositInUSD: {[RariPool]: number},
  fetchRariData: () => void,
  fetchLiquidityPoolsData: (liquidityPools: LiquidityPool[]) => void,
  toggleLiquidityPools: () => void,
  isFetchingLiquidityPoolsData: boolean,
  liquidityPoolsReducer: LiquidityPoolsReducerState,
  rates: Rates,
  hideLiquidityPools: boolean,
  checkArchanovaSession: () => void,
};

const RequestsWrapper = styled.View`
  margin-top: ${({ marginOnTop }) => marginOnTop ? 18 : 2}px;
  align-items: flex-end;
`;

const EmptyStateWrapper = styled.View`
  margin: 20px 0 30px;
`;

const referralImage = require('assets/images/referral_gift.png');

const poolTogetherLogo = require('assets/images/pool_together.png');
const daiIcon = require('assets/images/dai_color.png');
const usdcIcon = require('assets/images/usdc_color.png');

class HomeScreen extends React.Component<Props> {
  _willFocus: NavigationEventSubscription;
  forceRender = false;

  componentDidMount() {
    const isStaging = getEnv().ENVIRONMENT === STAGING;
    const {
      fetchBadges,
      fetchBadgeAwardHistory,
      fetchTransactionsHistory,
      fetchReferralRewardsIssuerAddresses,
      fetchDepositedAssets,
      fetchPoolStats,
      fetchUserStreams,
      fetchRariData,
      fetchLiquidityPoolsData,
      activeAccount,
    } = this.props;

    resetAppNotificationsBadgeNumber();

    this._willFocus = this.props.navigation.addListener('willFocus', () => {
      this.props.hideHomeUpdateIndicator();
    });

    // services are left for archanova only and will be decomissioned later
    if (isArchanovaAccount(activeAccount)) {
      fetchPoolStats();
      fetchDepositedAssets();
      fetchUserStreams();
      if (!isStaging) {
        fetchRariData();
      }
      fetchLiquidityPoolsData(LIQUIDITY_POOLS());
    }

    fetchReferralRewardsIssuerAddresses();
    fetchTransactionsHistory();
    fetchBadges();
    fetchBadgeAwardHistory();
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
    const isStaging = getEnv().ENVIRONMENT === STAGING;
    const {
      checkForMissedAssets,
      fetchAllCollectiblesData,
      fetchTransactionsHistory,
      fetchBadges,
      fetchBadgeAwardHistory,
      fetchAllAccountsBalances,
      fetchReferralRewardsIssuerAddresses,
      fetchReferralReward,
      fetchDepositedAssets,
      fetchPoolStats,
      fetchUserStreams,
      fetchRariData,
      fetchLiquidityPoolsData,
      checkArchanovaSession,
      activeAccount,
    } = this.props;

    checkArchanovaSession();
    checkForMissedAssets();
    fetchAllCollectiblesData();
    fetchBadges();
    fetchBadgeAwardHistory();
    fetchTransactionsHistory();
    fetchAllAccountsBalances();
    fetchReferralRewardsIssuerAddresses();
    fetchReferralReward();

    // services are left for archanova only and will be decomissioned later
    if (isArchanovaAccount(activeAccount)) {
      fetchDepositedAssets();
      fetchPoolStats();
      fetchUserStreams();
      if (!isStaging) {
        fetchRariData();
      }
      fetchLiquidityPoolsData(LIQUIDITY_POOLS());
    }
  };

  renderBadge = ({ item }) => {
    const { navigation } = this.props;
    return (
      <BadgeTouchableItem
        data={item}
        onPress={() => { navigation.navigate(BADGE, { badgeId: item.badgeId }); }}
        style={{ paddingHorizontal: 8 }}
      />
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

  renderEarnedInterestsPercent = (interestsPercentage: ?number) => {
    if (!interestsPercentage) return null;

    const { theme } = this.props;
    const colors = getThemeColors(theme);
    const formattedInterestsPercentage = Math.abs(interestsPercentage).toFixed(2);
    let earnedPercentTranslation = t('percentValue', { value: formattedInterestsPercentage });
    let earnedPercentColor = colors.basic010;

    if (interestsPercentage > 0) {
      earnedPercentTranslation = t('positivePercentValue', { value: formattedInterestsPercentage });
      earnedPercentColor = colors.secondaryAccent140;
    } else if (interestsPercentage < 0) {
      earnedPercentTranslation = t('negativePercentValue', { value: formattedInterestsPercentage });
      earnedPercentColor = colors.secondaryAccent240;
    }

    return (
      <BaseText color={earnedPercentColor} regular>{earnedPercentTranslation}</BaseText>
    );
  };

  renderRariPool = ({ item }) => {
    const { pool, balanceInUSD } = item;
    return <RariPoolItem pool={pool} balanceInUSD={balanceInUSD} />;
  }

  renderLiquidityPool = ({ item: { pool, poolStats } }) => {
    if (!poolStats) return null;

    const { rates, baseFiatCurrency } = this.props;
    const tokenBalance = poolStats.userLiquidityTokenBalance.toNumber() + poolStats.stakedAmount.toNumber();
    const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
    return (
      <ListItemWithImage
        label={pool.name}
        subtext={t('tokenValue', { value: formatAmountDisplay(tokenBalance), token: pool.symbol })}
        itemImageUrl={`${getEnv().SDK_PROVIDER}/${pool.iconUrl}?size=3`}
        onPress={() => this.props.navigation.navigate(LIQUIDITY_POOL_DASHBOARD, { pool })}
      >
        <BaseText big>
          {formatFiat(convertUSDToFiat(poolStats.currentPrice * tokenBalance, rates, fiatCurrency), fiatCurrency)}
        </BaseText>
      </ListItemWithImage>
    );
  }

  renderServiceWidgets = () => {
    const {
      activeAccount,
      depositedAssets,
      hideLendingDeposits,
      toggleLendingDeposits,
      isFetchingDepositedAssets,
      poolTogetherUserStats = [],
      isFetchingPoolStats,
      hidePoolTogether,
      togglePoolTogether,
      incomingStreams,
      outgoingStreams,
      isFetchingStreams,
      toggleSablier,
      hideSablier,
      rariUserDepositInUSD,
      toggleRari,
      hideRari,
      isFetchingRariData,
      hideLiquidityPools,
      isFetchingLiquidityPoolsData,
      toggleLiquidityPools,
      liquidityPoolsReducer,
      navigation,
    } = this.props;

    // services are left for archanova only and will be decomissioned later
    if (!isArchanovaAccount(activeAccount)) return null;

    // pooltogether
    const hasPoolTickets = poolTogetherUserStats.some(({ userTickets }) => userTickets > 0);

    // sablier
    const latestIncomingStream = incomingStreams.sort((a, b) => (+b.startTime) - (+a.startTime))[0];
    const latestOutgoingStream = outgoingStreams.sort((a, b) => (+b.startTime) - (+a.startTime))[0];
    const streams = [latestOutgoingStream, latestIncomingStream].filter(stream => !!stream);
    const hasStreams = !!streams.length;

    // rari
    const rariDeposits = Object.keys(rariUserDepositInUSD)
      .map(rariPool => ({
        pool: rariPool,
        balanceInUSD: rariUserDepositInUSD[rariPool],
      }))
      .filter(pool => !!pool.balanceInUSD);
    const hasRariDeposits = !!rariDeposits.length;

    // liquidity pools
    const purchasedLiquidityPools = LIQUIDITY_POOLS()
      .map((pool) => ({
        pool,
        poolStats: getPoolStats(pool, liquidityPoolsReducer),
      }))
      .filter(({ poolStats }) => poolStats?.userLiquidityTokenBalance.gt(0) || poolStats?.stakedAmount.gt(0));

    return (
      <>
        <DepositedAssets
          depositedAssets={depositedAssets}
          isFetchingDepositedAssets={isFetchingDepositedAssets}
          navigation={navigation}
          hideLendingDeposits={hideLendingDeposits}
          toggleLendingDeposits={toggleLendingDeposits}
        />
        {!!hasPoolTickets && (
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
        )}
        {!!hasStreams && (
          <CollapsibleSection
            label={t('sablierContent.moneyStreamingList.title')}
            showLoadingSpinner={isFetchingStreams}
            labelRight={isFetchingStreams ? null : t('button.viewAll')}
            onPressLabelRight={() => { navigation.navigate(SABLIER_STREAMS); }}
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
        )}
        {!!hasRariDeposits && (
          <CollapsibleSection
            label={t('rariContent.depositsList.title')}
            showLoadingSpinner={isFetchingRariData}
            labelRight={isFetchingRariData ? null : t('button.viewAll')}
            onPressLabelRight={() => { navigation.navigate(RARI_DEPOSIT); }}
            collapseContent={
              <FlatList
                data={rariDeposits}
                keyExtractor={(item) => item.pool}
                renderItem={this.renderRariPool}
                initialNumToRender={2}
                listKey="rari"
              />
            }
            onPress={toggleRari}
            open={!hideRari}
          />
        )}
        {!!purchasedLiquidityPools.length && (
          <CollapsibleSection
            label={t('liquidityPoolsContent.depositsList.title')}
            showLoadingSpinner={isFetchingLiquidityPoolsData}
            labelRight={isFetchingLiquidityPoolsData ? null : t('button.viewAll')}
            onPressLabelRight={() => { navigation.navigate(LIQUIDITY_POOLS_SCREEN); }}
            collapseContent={
              <FlatList
                data={purchasedLiquidityPools}
                keyExtractor={(item) => item.pool.name}
                renderItem={this.renderLiquidityPool}
                initialNumToRender={2}
                listKey="liquidityPools"
              />
            }
            onPress={toggleLiquidityPools}
            open={!hideLiquidityPools}
          />
        )}
      </>
    );
  }

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
      toggleBadges,
      walletConnectRequests,
      user,
      goToInvitationFlow,
      isPillarRewardCampaignActive,
      dismissReferFriends,
      referFriendsOnHomeScreenDismissed,
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

    return (
      <React.Fragment>
        <ContainerWithHeader
          headerProps={{
            leftItems: [
              {
                icon: 'hamburger',
                onPress: () => navigation.navigate(MENU),
                iconProps: { secondary: true, style: { marginLeft: -4 } },
              },
            ],
            // $FlowFixMe: react-navigation types
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
                      onPress={() => { navigation.navigate(WALLETCONNECT); }}
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
                        contentContainerStyle={[{ paddingHorizontal: 2, paddingTop: 26 }, badgesContainerStyle]}
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
                  {this.renderServiceWidgets()}
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
      baseFiatCurrency, hideBadges, hideLendingDeposits, hidePoolTogether, hideSablier, hideRari, hideLiquidityPools,
    },
  },
  walletConnect: { requests: walletConnectRequests },
  referrals: { isPillarRewardCampaignActive },
  insights: { referFriendsOnHomeScreenDismissed },
  lending: { depositedAssets, isFetchingDepositedAssets },
  poolTogether: { isFetchingPoolStats },
  sablier: { incomingStreams, outgoingStreams, isFetchingStreams },
  rari: {
    isFetchingRariData, userDepositInUSD: rariUserDepositInUSD,
  },
  liquidityPools: {
    isFetchingLiquidityPoolsData,
  },
  liquidityPools: liquidityPoolsReducer,
  rates: { data: rates },
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
  hideRari,
  hideLiquidityPools,
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
  isFetchingRariData,
  rariUserDepositInUSD,
  isFetchingLiquidityPoolsData,
  liquidityPoolsReducer,
  rates,
});

const structuredSelector = createStructuredSelector({
  history: combinedHistorySelector,
  openSeaTxHistory: combinedCollectiblesHistorySelector,
  poolTogetherUserStats: poolTogetherUserStatsSelector,
  sablierEvents: sablierEventsSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  fetchTransactionsHistory: () => dispatch(fetchTransactionsHistoryAction()),
  checkForMissedAssets: () => dispatch(checkForMissedAssetsAction()),
  hideHomeUpdateIndicator: () => dispatch(hideHomeUpdateIndicatorAction()),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
  fetchBadges: () => dispatch(fetchBadgesAction()),
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
  toggleRari: () => dispatch(toggleRariAction()),
  fetchRariData: () => dispatch(fetchRariDataAction()),
  fetchLiquidityPoolsData: (liquidityPools: LiquidityPool[]) => dispatch(fetchLiquidityPoolsDataAction(liquidityPools)),
  toggleLiquidityPools: () => dispatch(toggleLiquidityPoolsAction()),
  checkArchanovaSession: () => dispatch(checkArchanovaSessionIfNeededAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(HomeScreen));
