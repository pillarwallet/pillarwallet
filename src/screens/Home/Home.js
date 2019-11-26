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
import { Animated, RefreshControl, Platform, View, ScrollView, FlatList } from 'react-native';
import { connect } from 'react-redux';
import isEqual from 'lodash.isequal';
import type { NavigationScreenProp, NavigationEventSubscription } from 'react-navigation';
import firebase from 'react-native-firebase';
import { createStructuredSelector } from 'reselect';
import Intercom from 'react-native-intercom';

// components
import ActivityFeed from 'components/ActivityFeed';
import styled, { withTheme } from 'styled-components/native';
import { MediumText } from 'components/Typography';
import Tabs from 'components/Tabs';
import QRCodeScanner from 'components/QRCodeScanner';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { SettingsItemCarded } from 'components/ListItem/SettingsItemCarded';
import BadgeTouchableItem from 'components/BadgeTouchableItem';
import PortfolioBalance from 'components/PortfolioBalance';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import Toast from 'components/Toast';

// constants
import {
  MANAGE_DETAILS_SESSIONS,
  BADGE,
  SETTINGS,
} from 'constants/navigationConstants';
import { ALL, TRANSACTIONS, SOCIAL } from 'constants/activityConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import { TYPE_ACCEPTED } from 'constants/invitationsConstants';

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
import {
  requestSessionAction,
  cancelWaitingRequestAction,
} from 'actions/walletConnectActions';
import { logScreenViewAction } from 'actions/analyticsActions';
import { executeDeepLinkAction } from 'actions/deepLinkActions';

// selectors
import { accountHistorySelector } from 'selectors/history';
import { accountCollectiblesHistorySelector } from 'selectors/collectibles';

// utils
import { baseColors, spacing, fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';
import { mapTransactionsHistory, mapOpenSeaAndBCXTransactionsHistory } from 'utils/feedData';
import { filterSessionsByUrl } from 'screens/ManageDetailsSessions';

// models, types
import type { Account, Accounts } from 'models/Account';
import type { Badges, BadgeRewardEvent } from 'models/Badge';
import type { ContactSmartAddressData } from 'models/Contacts';
import type { Connector } from 'models/WalletConnect';
import type { UserEvent } from 'models/userEvent';
import type { Theme } from 'models/Theme';

type Props = {
  navigation: NavigationScreenProp<*>,
  contacts: Object[],
  invitations: Object[],
  user: Object,
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
  requestWalletConnectSession: (uri: string) => void,
  executeDeepLink: (uri: string) => void,
  cancelWaitingRequest: () => void,
  badges: Badges,
  fetchBadges: Function,
  connectors: Connector[],
  pendingConnector?: Connector,
  logScreenView: (view: string, screen: string) => void,
  activeAccount: ?Account,
  contactsSmartAddresses: ContactSmartAddressData[],
  accounts: Accounts,
  isOnline: boolean,
  userEvents: UserEvent[],
  fetchBadgeAwardHistory: () => void,
  badgesEvents: BadgeRewardEvent[],
  theme: Theme,
};

type State = {
  showCamera: boolean,
  usernameWidth: number,
  activeTab: string,
  permissionsGranted: boolean,
  scrollY: Animated.Value,
  isScanning: boolean,
  tabIsChanging: boolean,
};

const BalanceWrapper = styled.View`
  padding: ${spacing.medium}px ${spacing.large}px;
  width: 100%;
  border-bottom-width: 1px;
  border-color: ${themedColors.border};
`;

const WalletConnectWrapper = styled.View`
  padding: ${spacing.medium}px ${spacing.large}px 0;
  background-color: ${themedColors.surface};
  width: 100%;
`;

const ListHeader = styled(MediumText)`
  color: ${themedColors.accent};
  ${fontStyles.regular};
  margin: ${spacing.medium}px ${spacing.large}px ${spacing.small}px;
`;

const BadgesWrapper = styled.View`
  padding: ${spacing.medium}px 0;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${themedColors.border};
`;

const EmptyStateWrapper = styled.View`
  margin: 20px 0 30px;
`;

const allIconNormal = require('assets/icons/all_normal.png');
const allIconActive = require('assets/icons/all_active.png');
const socialIconNormal = require('assets/icons/social_normal.png');
const socialIconActive = require('assets/icons/social_active.png');
const transactionsIconNormal = require('assets/icons/transactions_normal.png');
const transactionsIconActive = require('assets/icons/transactions_active.png');
const iconConnect = require('assets/icons/icon_receive.png');

class HomeScreen extends React.Component<Props, State> {
  _willFocus: NavigationEventSubscription;
  forceRender = false;

  state = {
    showCamera: false,
    permissionsGranted: false,
    scrollY: new Animated.Value(0),
    activeTab: ALL,
    usernameWidth: 0,
    isScanning: false,
    tabIsChanging: false,
  };

  componentDidMount() {
    const { logScreenView, fetchBadges, fetchBadgeAwardHistory } = this.props;

    logScreenView('View home', 'Home');

    if (Platform.OS === 'ios') {
      firebase.notifications().setBadge(0);
    }

    this._willFocus = this.props.navigation.addListener('willFocus', () => {
      this.props.setUnreadNotificationsStatus(false);
    });
    fetchBadges();
    fetchBadgeAwardHistory();
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

  closeCamera = () => this.setState({ showCamera: false });

  refreshScreenData = () => {
    const {
      fetchTransactionsHistoryNotifications,
      fetchInviteNotifications,
      fetchAllCollectiblesData,
      fetchTransactionsHistory,
      fetchBadges,
    } = this.props;
    fetchTransactionsHistoryNotifications();
    fetchInviteNotifications();
    fetchAllCollectiblesData();
    fetchBadges();
    fetchTransactionsHistory();
  };

  setActiveTab = (activeTab) => {
    const { logScreenView } = this.props;

    logScreenView(`View tab Home.${activeTab}`, 'Home');
    this.setState({ activeTab });
  };

  openQRScanner = () => {
    const { isOnline } = this.props;
    if (!isOnline) {
      Toast.show({
        message: 'Cannot use Connect while offline',
        type: 'warning',
        title: 'Warning',
      });
      return;
    }
    this.setState({ isScanning: true });
  };

  closeQRScanner = () => this.setState({
    isScanning: false,
  });

  // START OF Wallet connect related methods
  validateQRCode = (uri: string): boolean => {
    return uri.startsWith('wc:') || uri.startsWith('pillarwallet:');
  };

  handleQRRead = (uri: string) => {
    const {
      requestWalletConnectSession,
      executeDeepLink,
    } = this.props;

    this.closeQRScanner();

    if (uri.startsWith('wc:')) {
      requestWalletConnectSession(uri);
    } else {
      executeDeepLink(uri);
    }
  };

  cancelWaiting = () => {
    this.props.cancelWaitingRequest();
  };
  // END OF Wallet connect related methods

  renderBadge = ({ item }) => {
    const { navigation } = this.props;
    return (
      <BadgeTouchableItem
        data={item}
        onPress={() => navigation.navigate(BADGE, { badgeId: item.badgeId })}
      />
    );
  };

  onTabChange = (isChanging?: boolean) => {
    this.setState({ tabIsChanging: isChanging });
  };

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
      invitations,
      pendingConnector,
      badges,
      connectors,
      contactsSmartAddresses,
      accounts,
      userEvents,
      badgesEvents,
      theme,
    } = this.props;
    const { colors } = theme;
    const {
      activeTab,
      isScanning,
      tabIsChanging,
    } = this.state;

    const tokenTxHistory = history.filter(({ tranType }) => tranType !== 'collectible');
    const bcxCollectiblesTxHistory = history.filter(({ tranType }) => tranType === 'collectible');

    const transactionsOnMainnet = mapTransactionsHistory(
      tokenTxHistory,
      contacts,
      contactsSmartAddresses,
      accounts,
      TRANSACTION_EVENT,
    );
    const collectiblesTransactions = mapOpenSeaAndBCXTransactionsHistory(openSeaTxHistory, bcxCollectiblesTxHistory);
    const mappedCTransactions = mapTransactionsHistory(
      collectiblesTransactions,
      contacts,
      contactsSmartAddresses,
      accounts,
      COLLECTIBLE_TRANSACTION,
    );

    const mappedContacts = contacts.map(({ ...rest }) => ({ ...rest, type: TYPE_ACCEPTED }));

    const activityFeedTabs = [
      {
        id: ALL,
        name: 'All',
        tabImageNormal: allIconNormal,
        tabImageActive: allIconActive,
        onPress: () => this.setActiveTab(ALL),
        data: [
          ...transactionsOnMainnet,
          ...mappedCTransactions,
          ...mappedContacts,
          ...invitations,
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
        tabImageNormal: transactionsIconNormal,
        tabImageActive: transactionsIconActive,
        onPress: () => this.setActiveTab(TRANSACTIONS),
        data: [...transactionsOnMainnet, ...mappedCTransactions],
        emptyState: {
          title: 'Make your first step',
          bodyText: 'Your transactions will appear here. Send or receive tokens to start.',
        },
      },
      {
        id: SOCIAL,
        name: 'Social',
        tabImageNormal: socialIconNormal,
        tabImageActive: socialIconActive,
        onPress: () => this.setActiveTab(SOCIAL),
        data: [...mappedContacts, ...invitations],
        emptyState: {
          title: 'Make your first step',
          bodyText: 'Information on your connections will appear here. Send a connection request to start.',
        },
      },
    ];

    const hasIntercomNotifications = !!intercomNotificationsCount;

    const sessionsCount = filterSessionsByUrl(connectors).length;
    const sessionsLabelPart = sessionsCount < 2 ? 'session' : 'sessions';
    const sessionsLabel = sessionsCount ? `${sessionsCount} ${sessionsLabelPart}` : '';

    const badgesContainerStyle = !badges.length ? { width: '100%', justifyContent: 'center' } : {};

    return (
      <ContainerWithHeader
        backgroundColor={colors.card}
        headerProps={{
          leftItems: [{ user: true }],
          rightItems: [
            {
              link: 'Settings',
              onPress: () => { navigation.navigate(SETTINGS); },
            },
            {
              link: 'Support',
              onPress: () => Intercom.displayMessenger(),
              withBackground: true,
              addon: hasIntercomNotifications && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: baseColors.sunYellow,
                    borderRadius: 4,
                    marginLeft: 4,
                    marginRight: -6,
                  }}
                />
              ),
            },
          ],
        }}
        inset={{ bottom: 0 }}
      >
        <ScrollView
          style={{ width: '100%', flex: 1 }}
          stickyHeaderIndices={[3]}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={this.refreshScreenData}
            />}
        >
          <BalanceWrapper>
            <PortfolioBalance />
          </BalanceWrapper>
          <WalletConnectWrapper>
            <SettingsItemCarded
              title="Manage Sessions"
              subtitle={sessionsLabel}
              onMainPress={() => navigation.navigate(MANAGE_DETAILS_SESSIONS)}
              onSettingsPress={this.openQRScanner}
              onSettingsLoadingPress={this.cancelWaiting}
              isLoading={!!pendingConnector}
              settingsIconSource={iconConnect}
              settingsLabel="Connect"
            />
          </WalletConnectWrapper>
          <BadgesWrapper>
            <ListHeader>Game of badges</ListHeader>
            <FlatList
              data={badges}
              horizontal
              keyExtractor={(item) => (item.id.toString())}
              renderItem={this.renderBadge}
              style={{ width: '100%' }}
              contentContainerStyle={{ paddingHorizontal: 10, ...badgesContainerStyle }}
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
          </BadgesWrapper>
          <Tabs
            tabs={activityFeedTabs}
            wrapperStyle={{ paddingTop: 16 }}
            onTabChange={this.onTabChange}
          />
          <ActivityFeed
            onCancelInvitation={cancelInvitation}
            onRejectInvitation={rejectInvitation}
            onAcceptInvitation={acceptInvitation}
            navigation={navigation}
            tabs={activityFeedTabs}
            activeTab={activeTab}
            hideTabs
            initialNumToRender={8}
            wrapperStyle={{ flexGrow: 1, opacity: tabIsChanging ? 0.5 : 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </ScrollView>
        <QRCodeScanner
          validator={this.validateQRCode}
          isActive={isScanning}
          onCancel={this.closeQRScanner}
          onRead={this.handleQRRead}
        />
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
  user: { data: user },
  invitations: { data: invitations },
  notifications: { intercomNotificationsCount },
  badges: { data: badges, badgesEvents },
  walletConnect: { connectors, pendingConnector },
  accounts: { data: accounts },
  session: { data: { isOnline } },
  userEvents: { data: userEvents },
}) => ({
  contacts,
  user,
  invitations,
  intercomNotificationsCount,
  badges,
  badgesEvents,
  connectors,
  pendingConnector,
  contactsSmartAddresses,
  accounts,
  isOnline,
  userEvents,
});

const structuredSelector = createStructuredSelector({
  history: accountHistorySelector,
  openSeaTxHistory: accountCollectiblesHistorySelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  cancelInvitation: (invitation) => dispatch(cancelInvitationAction(invitation)),
  acceptInvitation: (invitation) => dispatch(acceptInvitationAction(invitation)),
  rejectInvitation: (invitation) => dispatch(rejectInvitationAction(invitation)),
  fetchTransactionsHistory: () => dispatch(fetchTransactionsHistoryAction()),
  fetchTransactionsHistoryNotifications: () => dispatch(fetchTransactionsHistoryNotificationsAction()),
  fetchInviteNotifications: () => dispatch(fetchInviteNotificationsAction()),
  setUnreadNotificationsStatus: status => dispatch(setUnreadNotificationsStatusAction(status)),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
  requestWalletConnectSession: uri => dispatch(requestSessionAction(uri)),
  executeDeepLink: uri => dispatch(executeDeepLinkAction(uri)),
  cancelWaitingRequest: () => dispatch(cancelWaitingRequestAction()),
  fetchBadges: () => dispatch(fetchBadgesAction()),
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  fetchBadgeAwardHistory: () => dispatch(fetchBadgeAwardHistoryAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(HomeScreen));
