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
import styled from 'styled-components/native';
import { Wrapper } from 'components/Layout';
import { MediumText, Paragraph } from 'components/Typography';
import Tabs from 'components/Tabs';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import QRCodeScanner from 'components/QRCodeScanner';
import Spinner from 'components/Spinner';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { SettingsItemCarded } from 'components/ListItem/SettingsItemCarded';
import BadgeTouchableItem from 'components/BadgeTouchableItem';
import PortfolioBalance from 'components/PortfolioBalance';

// constants
import {
  ADD_EDIT_USER,
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
  restoreTransactionHistoryAction,
} from 'actions/historyActions';
import { setUnreadNotificationsStatusAction } from 'actions/notificationsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import { resetDeepLinkDataAction, approveLoginAttemptAction, executeDeepLinkAction } from 'actions/deepLinkActions';
import {
  cancelInvitationAction,
  acceptInvitationAction,
  rejectInvitationAction,
  fetchInviteNotificationsAction,
} from 'actions/invitationsActions';
import { onWalletConnectSessionRequest, cancelWaitingRequest } from 'actions/walletConnectActions';
import { fetchBadgesAction } from 'actions/badgesActions';
import { logScreenViewAction } from 'actions/analyticsActions';

// selectors
import { accountHistorySelector } from 'selectors/history';
import { accountCollectiblesHistorySelector } from 'selectors/collectibles';
import { activeAccountSelector } from 'selectors';

// utils
import { baseColors, fontSizes, fontWeights, spacing } from 'utils/variables';
import { mapTransactionsHistory, mapOpenSeaAndBCXTransactionsHistory } from 'utils/feedData';
import { getAccountAddress } from 'utils/accounts';

// types
import type { Account } from 'models/Account';

import type { Badges } from 'models/Badge';
import { filterSessionsByUrl } from 'screens/ManageDetailsSessions';

type Props = {
  navigation: NavigationScreenProp<*>,
  contacts: Object[],
  invitations: Object[],
  history: Object[],
  user: Object,
  fetchTransactionsHistoryNotifications: Function,
  fetchTransactionsHistory: () => Function,
  fetchInviteNotifications: Function,
  acceptInvitation: Function,
  cancelInvitation: Function,
  rejectInvitation: Function,
  setUnreadNotificationsStatus: Function,
  homeNotifications: Object[],
  intercomNotificationsCount: number,
  fetchAllCollectiblesData: Function,
  resetDeepLinkData: Function,
  approveLoginAttempt: Function,
  openSeaTxHistory: Object[],
  history: Array<*>,
  waitingRequest?: string,
  onWalletConnectSessionRequest: Function,
  onWalletLinkScan: Function,
  cancelWaitingRequest: Function,
  loginAttemptToken?: string,
  badges: Badges,
  fetchBadges: Function,
  connectors: any[],
  logScreenView: (view: string, screen: string) => void,
  restoreTransactionHistory: (walletAddress: string, walletId: string) => void,
  activeAccount: Account,
};

type State = {
  showCamera: boolean,
  usernameWidth: number,
  activeTab: string,
  permissionsGranted: boolean,
  scrollY: Animated.Value,
  addEmailRedirect: boolean,
  isScanning: boolean,
  showLoginModal: boolean,
};

const BalanceWrapper = styled.View`
  padding: ${spacing.medium}px ${spacing.large}px;
  width: 100%;
  border-bottom-width: 1px;
  border-color: ${baseColors.mediumLightGray};
`;

const WalletConnectWrapper = styled.View`
  padding: ${spacing.medium}px ${spacing.large}px 0;
  background-color: ${baseColors.snowWhite};
  width: 100%;
`;

const ListHeader = styled(MediumText)`
  color: ${baseColors.blueYonder};
  font-size: 14px;
  line-height: 17px;
  margin: ${spacing.mediumLarge}px ${spacing.large}px;
`;

const BadgesWrapper = styled.View`
  padding: ${spacing.medium}px 0;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${baseColors.mediumLightGray};
`;

const Description = styled(Paragraph)`
  text-align: center;
  padding-bottom: ${spacing.rhythm}px;
  line-height: ${fontSizes.mediumLarge};
`;

const DescriptionWarning = styled(Description)`
  font-size: ${fontSizes.small};
  font-weight: ${fontWeights.bold};
  color: ${baseColors.burningFire};
`;

export const LoadingSpinner = styled(Spinner)`
  padding: 10px;
  align-items: center;
  justify-content: center;
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

  state = {
    addEmailRedirect: false,
    showCamera: false,
    permissionsGranted: false,
    scrollY: new Animated.Value(0),
    activeTab: ALL,
    usernameWidth: 0,
    isScanning: false,
    showLoginModal: false,
  };

  componentDidMount() {
    const { fetchTransactionsHistory, logScreenView } = this.props;

    logScreenView('View home', 'Home');

    if (Platform.OS === 'ios') {
      firebase.notifications().setBadge(0);
    }

    // TODO: remove this when notifications service becomes reliable
    fetchTransactionsHistory();

    this._willFocus = this.props.navigation.addListener('willFocus', () => {
      this.props.setUnreadNotificationsStatus(false);
    });
  }

  componentWillUnmount() {
    this.props.resetDeepLinkData();
    this._willFocus.remove();
  }

  shouldComponentUpdate(nextProps: Props, nextState: State) {
    const isFocused = this.props.navigation.isFocused();
    if (!isFocused) {
      return false;
    }
    const isEq = isEqual(this.props, nextProps) && isEqual(this.state, nextState);
    return !isEq;
  }

  refreshScreenData = () => {
    const {
      fetchTransactionsHistoryNotifications,
      fetchInviteNotifications,
      fetchAllCollectiblesData,
      restoreTransactionHistory,
      activeAccount,
      fetchBadges,
    } = this.props;
    fetchTransactionsHistoryNotifications();
    fetchInviteNotifications();
    fetchAllCollectiblesData();
    fetchBadges();

    /**
     * this is used only to avoid BCX fetching issues,
     * TODO: remove fetching from ethplorer when BCX is fixed or BCX2 is released
     */
    restoreTransactionHistory(getAccountAddress(activeAccount), activeAccount.walletId);
  };

  setActiveTab = (activeTab) => {
    const { logScreenView } = this.props;

    logScreenView(`View tab Home.${activeTab}`, 'Home');
    this.setState({ activeTab });
  };

  /**
   * modals can't be shown if one is not fully closed,
   * this issue happens on iOS when camera modal is not yet closed
   * and forum login approve modal is set to appear
   * https://github.com/react-native-community/react-native-modal#i-cant-show-multiple-modals-one-after-another
   */
  checkLoginModalVisibility = () => {
    const { loginAttemptToken } = this.props;
    const { showLoginModal } = this.state;
    if (!!loginAttemptToken && !showLoginModal) {
      this.setState({ showLoginModal: true });
    }
  };

  /**
   * modals can't be shown if one is not fully closed,
   * this case happens on iOS when login approve modal is not yet closed
   * and add email modal is set to appear on other screen
   * https://github.com/react-native-community/react-native-modal#i-cant-show-multiple-modals-one-after-another
   */
  checkAddEmailRedirect = () => {
    const { navigation } = this.props;
    const { addEmailRedirect } = this.state;
    if (!addEmailRedirect) return;
    this.setState({ addEmailRedirect: false }, () => {
      /**
      * NOTE: `showLoginModal` needs reset because
      * after: (1) navigating to email settings with login token to approve
      * then (2) saving email and (3) closing email modal should have
      * login approve modal open in Home screen, however,
      * login approve modal cannot be open while navigating
      */
      this.setState({ showLoginModal: true });
      navigation.navigate(ADD_EDIT_USER);
    });
  };

  closeLoginModal = () => {
    const { navigation, resetDeepLinkData } = this.props;
    resetDeepLinkData();
    this.setState({ showLoginModal: false });
    const showLoginApproveModal = navigation.getParam('showLoginApproveModal');
    if (showLoginApproveModal) {
      navigation.setParams({ showLoginApproveModal: null });
    }
  };

  // START OF Wallet connect related methods
  validateWalletConnectQRCode = (uri: string) => {
    return uri.startsWith('wc:') || uri.startsWith('pillarwallet:');
  };

  handleQRScannerClose = () => this.setState({ isScanning: false });

  toggleQRScanner = () => this.setState({ isScanning: !this.state.isScanning });

  handleQRRead = (uri: string) => {
    if (uri.startsWith('wc:')) {
      this.props.onWalletConnectSessionRequest(uri);
    } else {
      this.props.onWalletLinkScan(uri);
    }
    this.handleQRScannerClose();
  };

  cancelWaiting = () => {
    const { waitingRequest } = this.props;

    if (waitingRequest) {
      this.props.cancelWaitingRequest(waitingRequest);
    }
  };
  // END OF Wallet connect related methods

  renderBadge = ({ item }) => {
    const { navigation } = this.props;
    return (
      <BadgeTouchableItem
        data={item}
        onPress={() => navigation.navigate(BADGE, { id: item.id })}
      />
    );
  };

  render() {
    const {
      user,
      cancelInvitation,
      acceptInvitation,
      rejectInvitation,
      intercomNotificationsCount,
      navigation,
      loginAttemptToken,
      approveLoginAttempt,
      history,
      openSeaTxHistory,
      contacts,
      invitations,
      waitingRequest,
      badges,
      connectors,
    } = this.props;

    const {
      activeTab,
      isScanning,
      showLoginModal,
    } = this.state;

    const tokenTxHistory = history.filter(({ tranType }) => tranType !== 'collectible');
    const bcxCollectiblesTxHistory = history.filter(({ tranType }) => tranType === 'collectible');

    const transactionsOnMainnet = mapTransactionsHistory(tokenTxHistory, contacts, TRANSACTION_EVENT);
    const collectiblesTransactions = mapOpenSeaAndBCXTransactionsHistory(openSeaTxHistory, bcxCollectiblesTxHistory);
    const mappedCTransactions = mapTransactionsHistory(collectiblesTransactions, contacts, COLLECTIBLE_TRANSACTION);

    const mappedContacts = contacts.map(({ ...rest }) => ({ ...rest, type: TYPE_ACCEPTED }));

    const activityFeedTabs = [
      {
        id: ALL,
        name: 'All',
        tabImageNormal: allIconNormal,
        tabImageActive: allIconActive,
        onPress: () => this.setActiveTab(ALL),
        data: [...transactionsOnMainnet, ...mappedCTransactions, ...mappedContacts, ...invitations],
        emptyState: {
          title: 'Make your first step',
          body: 'Your activity will appear here.',
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
          body: 'Your transactions will appear here. Send or receive tokens to start.',
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
          body: 'Information on your connections will appear here. Send a connection request to start.',
        },
      },
    ];

    const hasIntercomNotifications = !!intercomNotificationsCount;

    // getting from navigation params solves case when forum login approve modal should appear after PIN screen
    const isLoginModalVisible = showLoginModal || navigation.getParam('showLoginApproveModal');

    const sessionsCount = filterSessionsByUrl(connectors).length;
    const sessionsLabelPart = sessionsCount < 2 ? 'session' : 'sessions';
    const sessionsLabel = sessionsCount ? `${sessionsCount} ${sessionsLabelPart}` : '';

    return (
      <ContainerWithHeader
        backgroundColor={baseColors.white}
        headerProps={{
          leftItems: [
            { user: true },
          ],
          rightItems: [
            {
              label: 'Settings',
              onPress: () => { navigation.navigate(SETTINGS); },
            },
            {
              label: 'Support',
              onPress: () => Intercom.displayMessenger(),
              bordered: true,
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
          stickyHeaderIndices={badges.length ? [3] : [2]}
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
              title="Wallet Connect"
              subtitle={sessionsLabel}
              onMainPress={() => navigation.navigate(MANAGE_DETAILS_SESSIONS)}
              onSettingsPress={this.toggleQRScanner}
              onSettingsLoadingPress={this.cancelWaiting}
              isLoading={!!waitingRequest}
              settingsIconSource={iconConnect}
              settingsLabel="Connect"
            />
          </WalletConnectWrapper>
          {!!badges.length &&
          <BadgesWrapper>
            <ListHeader>Game of badges</ListHeader>
            <FlatList
              data={badges}
              horizontal
              keyExtractor={(item) => (item.id.toString())}
              renderItem={this.renderBadge}
              style={{ width: '100%' }}
              contentContainerStyle={{ paddingHorizontal: 10 }}
              initialNumToRender={5}
            />
          </BadgesWrapper>}
          <Tabs
            tabs={activityFeedTabs}
            wrapperStyle={{ paddingTop: 16 }}
          />
          <ActivityFeed
            backgroundColor={baseColors.white}
            onCancelInvitation={cancelInvitation}
            onRejectInvitation={rejectInvitation}
            onAcceptInvitation={acceptInvitation}
            navigation={navigation}
            tabs={activityFeedTabs}
            activeTab={activeTab}
            hideTabs
            initialNumToRender={6}
            wrapperStyle={{ flexGrow: 1 }}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        </ScrollView>
        <QRCodeScanner
          validator={this.validateWalletConnectQRCode}
          isActive={isScanning}
          onDismiss={this.handleQRScannerClose}
          onRead={this.handleQRRead}
          onModalHide={this.checkLoginModalVisibility}
        />

        <SlideModal
          isVisible={!!loginAttemptToken && isLoginModalVisible}
          fullScreen
          showHeader
          onModalHide={this.closeLoginModal}
          onModalHidden={this.checkAddEmailRedirect}
          backgroundColor={baseColors.snowWhite}
          avoidKeyboard
          centerTitle
          title="confirm"
        >
          <Wrapper flex={1} center regularPadding>
            <View style={{ justifyContent: 'center', display: 'flex', alignItems: 'center' }}>
              <Description>
                You are about to confirm your login with your Pillar wallet to external resource.
              </Description>
              {!user.email && (
                <DescriptionWarning>
                  In order to proceed with Discourse login you must have email added to your profile.
                </DescriptionWarning>
              )}
              <Button
                title={!user.email ? 'Add your email' : 'Confirm login'}
                onPress={() => (user.email
                    ? approveLoginAttempt(loginAttemptToken)
                    : this.setState({ showLoginModal: false, addEmailRedirect: true })
                )}
                style={{
                  marginBottom: 13,
                }}
              />
            </View>
          </Wrapper>
        </SlideModal>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
  user: { data: user },
  invitations: { data: invitations },
  notifications: { intercomNotificationsCount },
  deepLink: { data: { loginAttemptToken } = {} },
  badges: { data: badges },
  walletConnect: { connectors },
}) => ({
  contacts,
  user,
  invitations,
  intercomNotificationsCount,
  loginAttemptToken,
  badges,
  connectors,
});

const structuredSelector = createStructuredSelector({
  history: accountHistorySelector,
  openSeaTxHistory: accountCollectiblesHistorySelector,
  activeAccount: activeAccountSelector,
});

const combinedMapStateToProps = (state) => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch) => ({
  cancelInvitation: (invitation) => dispatch(cancelInvitationAction(invitation)),
  acceptInvitation: (invitation) => dispatch(acceptInvitationAction(invitation)),
  rejectInvitation: (invitation) => dispatch(rejectInvitationAction(invitation)),
  fetchTransactionsHistoryNotifications: () => dispatch(fetchTransactionsHistoryNotificationsAction()),
  fetchTransactionsHistory: () => dispatch(fetchTransactionsHistoryAction()),
  fetchInviteNotifications: () => dispatch(fetchInviteNotificationsAction()),
  setUnreadNotificationsStatus: status => dispatch(setUnreadNotificationsStatusAction(status)),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
  resetDeepLinkData: () => dispatch(resetDeepLinkDataAction()),
  approveLoginAttempt: loginAttemptToken => dispatch(approveLoginAttemptAction(loginAttemptToken)),
  onWalletConnectSessionRequest: uri => dispatch(onWalletConnectSessionRequest(uri)),
  onWalletLinkScan: uri => dispatch(executeDeepLinkAction(uri)),
  cancelWaitingRequest: clientId => dispatch(cancelWaitingRequest(clientId)),
  fetchBadges: () => dispatch(fetchBadgesAction()),
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  restoreTransactionHistory: (walletAddress: string, walletId: string) => dispatch(
    restoreTransactionHistoryAction(walletAddress, walletId),
  ),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(HomeScreen);

