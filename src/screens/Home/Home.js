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
import { RefreshControl, View, FlatList, Dimensions } from 'react-native';
import { connect } from 'react-redux';
import isEqual from 'lodash.isequal';
import type { NavigationScreenProp, NavigationEventSubscription } from 'react-navigation';
import { createStructuredSelector } from 'reselect';
import Intercom from 'react-native-intercom';

// components
import ActivityFeed from 'components/ActivityFeed';
import styled, { withTheme } from 'styled-components/native';
import Tabs from 'components/Tabs';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import BadgeTouchableItem from 'components/BadgeTouchableItem';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import { Banner } from 'components/Banner';
import IconButton from 'components/IconButton';
import Loader from 'components/Loader';
import CollapsibleSection from 'components/CollapsibleSection';
import ButtonText from 'components/ButtonText';
import Requests from 'screens/WalletConnect/Requests';
import UserNameAndImage from 'components/UserNameAndImage';

// constants
import { BADGE, MENU, WALLETCONNECT } from 'constants/navigationConstants';
import { ALL, TRANSACTIONS } from 'constants/activityConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';

// actions
import {
  fetchTransactionsHistoryAction,
  fetchTransactionsHistoryNotificationsAction,
} from 'actions/historyActions';
import { setUnreadNotificationsStatusAction } from 'actions/notificationsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import {
  cancelInvitationAction,
  acceptInvitationAction,
  rejectInvitationAction,
  fetchInviteNotificationsAction,
} from 'actions/invitationsActions';
import { fetchBadgesAction, fetchBadgeAwardHistoryAction } from 'actions/badgesActions';
import { logScreenViewAction } from 'actions/analyticsActions';
import {
  goToInvitationFlowAction,
  fetchReferralRewardsIssuerAddressesAction,
  fetchReferralRewardAction,
} from 'actions/referralsActions';
import { toggleBadgesAction } from 'actions/appSettingsActions';
import { fetchAllAccountsBalancesAction } from 'actions/assetsActions';
import { refreshBitcoinBalanceAction } from 'actions/bitcoinActions';
import { dismissReferFriendsOnHomeScreenAction } from 'actions/insightsActions';

// selectors
import { combinedHistorySelector } from 'selectors/history';
import { combinedCollectiblesHistorySelector } from 'selectors/collectibles';

// utils
import { spacing, fontSizes } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';
import { mapTransactionsHistory, mapOpenSeaAndBCXTransactionsHistory } from 'utils/feedData';
import { resetAppNotificationsBadgeNumber } from 'utils/notifications';

// models, types
import type { Account, Accounts } from 'models/Account';
import type { Badges, BadgeRewardEvent } from 'models/Badge';
import type { ContactSmartAddressData } from 'models/Contacts';
import type { CallRequest, Connector } from 'models/WalletConnect';
import type { UserEvent } from 'models/userEvent';
import type { Theme } from 'models/Theme';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { User } from 'models/User';

// partials
import WalletsPart from './WalletsPart';
// import BalanceGraph from './BalanceGraph';

type Props = {
  navigation: NavigationScreenProp<*>,
  contacts: Object[],
  user: User,
  fetchTransactionsHistory: Function,
  fetchTransactionsHistoryNotifications: Function,
  fetchInviteNotifications: Function,
  acceptInvitation: Function,
  cancelInvitation: Function,
  rejectInvitation: Function,
  setUnreadNotificationsStatus: Function,
  homeNotifications: Object[],
  intercomNotificationsCount: number,
  fetchAllCollectiblesData: Function,
  openSeaTxHistory: Object[],
  history: Object[],
  badges: Badges,
  fetchBadges: Function,
  pendingConnector: ?Connector,
  logScreenView: (view: string, screen: string) => void,
  activeAccount: ?Account,
  contactsSmartAddresses: ContactSmartAddressData[],
  accounts: Accounts,
  userEvents: UserEvent[],
  fetchBadgeAwardHistory: () => void,
  badgesEvents: BadgeRewardEvent[],
  theme: Theme,
  baseFiatCurrency: ?string,
  goToInvitationFlow: () => void,
  hideBadges: boolean,
  toggleBadges: () => void,
  walletConnectRequests: CallRequest[],
  fetchAllAccountsBalances: () => void,
  refreshBitcoinBalance: () => void,
  fetchReferralRewardsIssuerAddresses: () => void,
  fetchReferralReward: () => void,
  isPillarRewardCampaignActive: boolean,
  dismissReferFriends: () => void,
  referFriendsOnHomeScreenDismissed: boolean,
};

type State = {
  activeTab: string,
  loaderMessage: string,
};


const {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
} = Dimensions.get('window');


const RequestsWrapper = styled.View`
  margin-top: ${({ marginOnTop }) => marginOnTop ? 18 : 2}px;
  align-items: flex-end;
`;

const EmptyStateWrapper = styled.View`
  margin: 20px 0 30px;
`;

const LoaderWrapper = styled.View`
  position: absolute;
  top: 0;
  left: 0;
  align-items: center;
  justify-content: center;
  height: ${SCREEN_HEIGHT}px;
  width: ${SCREEN_WIDTH}px;
  background-color: ${themedColors.surface};
  z-index: 99999;
`;

const referralImage = require('assets/images/referral_gift.png');

class HomeScreen extends React.Component<Props, State> {
  _willFocus: NavigationEventSubscription;
  forceRender = false;
  scrollViewRef = null;

  state = {
    activeTab: ALL,
    loaderMessage: '',
  };

  componentDidMount() {
    const {
      logScreenView,
      fetchBadges,
      fetchBadgeAwardHistory,
      fetchTransactionsHistory,
      fetchReferralRewardsIssuerAddresses,
    } = this.props;

    logScreenView('View home', 'Home');

    resetAppNotificationsBadgeNumber();

    this._willFocus = this.props.navigation.addListener('willFocus', () => {
      this.props.setUnreadNotificationsStatus(false);
    });
    fetchTransactionsHistory();
    fetchBadges();
    fetchBadgeAwardHistory();
    fetchReferralRewardsIssuerAddresses();
  }

  componentWillUnmount() {
    this._willFocus.remove();
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
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
      fetchTransactionsHistoryNotifications,
      fetchInviteNotifications,
      fetchAllCollectiblesData,
      fetchTransactionsHistory,
      fetchBadges,
      fetchBadgeAwardHistory,
      fetchAllAccountsBalances,
      refreshBitcoinBalance,
      fetchReferralRewardsIssuerAddresses,
      fetchReferralReward,
    } = this.props;

    fetchTransactionsHistoryNotifications();
    fetchInviteNotifications();
    fetchAllCollectiblesData();
    fetchBadges();
    fetchBadgeAwardHistory();
    fetchTransactionsHistory();
    fetchAllAccountsBalances();
    refreshBitcoinBalance();
    fetchReferralRewardsIssuerAddresses();
    fetchReferralReward();
  };

  setActiveTab = (activeTab) => {
    const { logScreenView } = this.props;

    logScreenView(`View tab Home.${activeTab}`, 'Home');
    this.setState({ activeTab });
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

  handleWalletChange = (loaderMessage: string) => {
    this.setState({ loaderMessage });
  };

  setScrollViewScrollable = (scrollEnabled: boolean) => {
    if (this.scrollViewRef) {
      this.scrollViewRef.setNativeProps({ scrollEnabled });
    }
  }

  render() {
    const {
      cancelInvitation,
      acceptInvitation,
      rejectInvitation,
      intercomNotificationsCount,
      navigation,
      history,
      openSeaTxHistory,
      contacts,
      badges,
      contactsSmartAddresses,
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
    } = this.props;

    const { activeTab, loaderMessage } = this.state;

    const tokenTxHistory = history.filter(({ tranType }) => tranType !== 'collectible');
    const bcxCollectiblesTxHistory = history.filter(({ tranType }) => tranType === 'collectible');

    const transactionsOnMainnet = mapTransactionsHistory(
      tokenTxHistory,
      contacts,
      contactsSmartAddresses,
      accounts,
      TRANSACTION_EVENT,
      true,
      true,
    );

    const collectiblesTransactions =
      mapOpenSeaAndBCXTransactionsHistory(openSeaTxHistory, bcxCollectiblesTxHistory, true);

    const mappedCTransactions = mapTransactionsHistory(
      collectiblesTransactions,
      contacts,
      contactsSmartAddresses,
      accounts,
      COLLECTIBLE_TRANSACTION,
      true,
    );

    const activityFeedTabs = [
      {
        id: ALL,
        name: 'All',
        icon: 'cube',
        onPress: () => this.setActiveTab(ALL),
        data: [
          ...transactionsOnMainnet,
          ...mappedCTransactions,
          ...userEvents,
          ...badgesEvents,
        ],
        emptyState: {
          title: 'Make your first step',
          bodyText: 'Your activity will appear here.',
        },
      },
      {
        id: TRANSACTIONS,
        name: 'Transactions',
        icon: 'paperPlane',
        onPress: () => this.setActiveTab(TRANSACTIONS),
        data: [...transactionsOnMainnet, ...mappedCTransactions],
        emptyState: {
          title: 'Make your first step',
          bodyText: 'Your transactions will appear here. Send or receive tokens to start.',
        },
      },
    ];

    const hasIntercomNotifications = !!intercomNotificationsCount;

    const badgesContainerStyle = !badges.length ? { width: '100%', justifyContent: 'center' } : {};
    const colors = getThemeColors(theme);
    const referralBannerText = isPillarRewardCampaignActive
      ? 'Refer friends and earn rewards, free PLR and more.'
      : 'Invite friends to Pillar';

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
                link: 'Support',
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
              scrollViewRef={ref => {
                this.scrollViewRef = ref;
              }}
              onCancelInvitation={cancelInvitation}
              onRejectInvitation={rejectInvitation}
              onAcceptInvitation={acceptInvitation}
              navigation={navigation}
              tabs={activityFeedTabs}
              activeTab={activeTab}
              hideTabs
              initialNumToRender={8}
              wrapperStyle={{ flexGrow: 1 }}
              contentContainerStyle={{ flexGrow: 1 }}
              isForAllAccounts
              headerComponent={(
                <React.Fragment>
                  <WalletsPart handleWalletChange={this.handleWalletChange} />
                  {/* <BalanceGraph
                    onDragStart={() => this.setScrollViewScrollable(false)}
                    onDragEnd={() => this.setScrollViewScrollable(true)}
                  /> */}
                  {!!walletConnectRequests &&
                  <RequestsWrapper marginOnTop={walletConnectRequests.length === 1}>
                    {walletConnectRequests.length > 1 &&
                    <ButtonText
                      onPress={() => navigation.navigate(WALLETCONNECT)}
                      buttonText={`View all ${walletConnectRequests.length}`}
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
                    label="Game of badges"
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
                              title="No badges"
                              bodyText="You do not have badges yet"
                            />
                          </EmptyStateWrapper>
                        )}
                      />
                    }
                    onPress={toggleBadges}
                    open={!hideBadges}
                  />
                </React.Fragment>
              )}
              tabsComponent={(
                <Tabs
                  tabs={activityFeedTabs}
                  wrapperStyle={{ paddingTop: 16 }}
                  activeTab={activeTab}
                />
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
        {!!loaderMessage &&
          <LoaderWrapper><Loader messages={[loaderMessage]} /></LoaderWrapper>
        }
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
  user: { data: user },
  notifications: { intercomNotificationsCount },
  badges: { data: badges, badgesEvents },
  accounts: { data: accounts },
  userEvents: { data: userEvents },
  appSettings: { data: { baseFiatCurrency, hideBadges } },
  walletConnect: { requests: walletConnectRequests },
  referrals: { isPillarRewardCampaignActive },
  insights: { referFriendsOnHomeScreenDismissed },
}: RootReducerState): $Shape<Props> => ({
  contacts,
  user,
  intercomNotificationsCount,
  badges,
  badgesEvents,
  contactsSmartAddresses,
  accounts,
  userEvents,
  baseFiatCurrency,
  hideBadges,
  walletConnectRequests,
  isPillarRewardCampaignActive,
  referFriendsOnHomeScreenDismissed,
});

const structuredSelector = createStructuredSelector({
  history: combinedHistorySelector,
  openSeaTxHistory: combinedCollectiblesHistorySelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  cancelInvitation: (invitation) => dispatch(cancelInvitationAction(invitation)),
  acceptInvitation: (invitation) => dispatch(acceptInvitationAction(invitation)),
  rejectInvitation: (invitation) => dispatch(rejectInvitationAction(invitation)),
  fetchTransactionsHistory: () => dispatch(fetchTransactionsHistoryAction(true)),
  fetchTransactionsHistoryNotifications: () => dispatch(fetchTransactionsHistoryNotificationsAction()),
  fetchInviteNotifications: () => dispatch(fetchInviteNotificationsAction()),
  setUnreadNotificationsStatus: status => dispatch(setUnreadNotificationsStatusAction(status)),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction(true)),
  fetchBadges: () => dispatch(fetchBadgesAction()),
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  fetchBadgeAwardHistory: () => dispatch(fetchBadgeAwardHistoryAction()),
  goToInvitationFlow: () => dispatch(goToInvitationFlowAction()),
  toggleBadges: () => dispatch(toggleBadgesAction()),
  fetchAllAccountsBalances: () => dispatch(fetchAllAccountsBalancesAction()),
  refreshBitcoinBalance: () => dispatch(refreshBitcoinBalanceAction(false)),
  fetchReferralRewardsIssuerAddresses: () => dispatch(fetchReferralRewardsIssuerAddressesAction()),
  fetchReferralReward: () => dispatch(fetchReferralRewardAction()),
  dismissReferFriends: () => dispatch(dismissReferFriendsOnHomeScreenAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(HomeScreen));
