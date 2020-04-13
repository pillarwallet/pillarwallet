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
import { MediumText } from 'components/Typography';
import Tabs from 'components/Tabs';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import BadgeTouchableItem from 'components/BadgeTouchableItem';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import { Banner } from 'components/Banner';
import IconButton from 'components/IconButton';
import ProfileImage from 'components/ProfileImage';
import ReferralModalReward from 'components/ReferralRewardModal/ReferralModalReward';
import Loader from 'components/Loader';

// constants
import {
  BADGE,
  REFER_FLOW,
  MENU,
  MANAGE_USERS_FLOW,
} from 'constants/navigationConstants';
import { ALL, TRANSACTIONS, SOCIAL } from 'constants/activityConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import { TYPE_ACCEPTED } from 'constants/invitationsConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';

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

// selectors
import { accountHistorySelector } from 'selectors/history';
import { accountCollectiblesHistorySelector } from 'selectors/collectibles';
import { activeBlockchainSelector } from 'selectors/selectors';

// utils
import { spacing, fontStyles, fontSizes } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';
import { mapTransactionsHistory, mapOpenSeaAndBCXTransactionsHistory } from 'utils/feedData';
import { resetAppNotificationsBadgeNumber } from 'utils/notifications';
import { toastReferral } from 'utils/toasts';

// models, types
import type { Account, Accounts } from 'models/Account';
import type { Badges, BadgeRewardEvent } from 'models/Badge';
import type { ContactSmartAddressData } from 'models/Contacts';
import type { Connector } from 'models/WalletConnect';
import type { UserEvent } from 'models/userEvent';
import type { Theme } from 'models/Theme';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';
import type { User } from 'models/User';

// partials
import WalletsPart from './WalletsPart';

type Props = {
  navigation: NavigationScreenProp<*>,
  contacts: Object[],
  invitations: Object[],
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
  connectors: Connector[],
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
  activeBlockchainNetwork: ?string,
  referralsFeatureEnabled: boolean,
};

type State = {
  activeTab: string,
  isReferralBannerVisible: boolean,
  showRewardModal: boolean,
  loaderMessage: string,
};


const {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
} = Dimensions.get('window');
const profileImageWidth = 24;

const ListHeader = styled(MediumText)`
  color: ${themedColors.accent};
  ${fontStyles.regular};
  margin: ${spacing.medium}px ${spacing.layoutSides}px ${spacing.small}px;
`;

const BadgesWrapper = styled.View`
  padding-top: ${spacing.medium}px;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${themedColors.border};
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

  state = {
    activeTab: ALL,
    isReferralBannerVisible: true,
    showRewardModal: false,
    loaderMessage: '',
  };

  componentDidMount() {
    const {
      logScreenView,
      fetchBadges,
      fetchBadgeAwardHistory,
    } = this.props;

    logScreenView('View home', 'Home');

    resetAppNotificationsBadgeNumber();

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

  renderBadge = ({ item }) => {
    const { navigation } = this.props;
    return (
      <BadgeTouchableItem
        data={item}
        onPress={() => navigation.navigate(BADGE, { badgeId: item.badgeId })}
      />
    );
  };

  renderUser = () => {
    const { user, navigation } = this.props;
    const userImageUri = user.profileImage ? `${user.profileImage}?t=${user.lastUpdateTime || 0}` : null;
    return (
      <ProfileImage
        uri={userImageUri}
        userName={user.username}
        diameter={profileImageWidth}
        noShadow
        borderWidth={0}
        onPress={() => navigation.navigate(MANAGE_USERS_FLOW)}
      />
    );
  };

  handleReferralBannerPress = () => {
    const { navigation, user } = this.props;
    const { isEmailVerified, isPhoneVerified } = user;
    if (isEmailVerified || isPhoneVerified) {
      navigation.navigate(REFER_FLOW);
    } else {
      toastReferral(navigation);
    }
  };

  renderReferral = (colors) => {
    const { isReferralBannerVisible } = this.state;

    return (
      <Banner
        isVisible={isReferralBannerVisible}
        onPress={this.handleReferralBannerPress}
        bannerText="Refer friends and earn rewards, free PLR and more."
        imageProps={{
          style: {
            width: 96,
            height: 60,
            marginRight: -4,
          },
          source: referralImage,
        }}
        wrapperStyle={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        onClose={() => this.setState({ isReferralBannerVisible: false })}
      />
    );
  };

  handleModalHide = (callback: () => void) => {
    this.setState({ showRewardModal: false }, () => {
      if (callback) callback();
    });
  };

  handleWalletChange = (loaderMessage: string) => {
    this.setState({ loaderMessage });
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
      badges,
      contactsSmartAddresses,
      accounts,
      userEvents,
      badgesEvents,
      theme,
      activeBlockchainNetwork,
      referralsFeatureEnabled,
    } = this.props;

    const { activeTab, showRewardModal, loaderMessage } = this.state;

    const tokenTxHistory = history.filter(({ tranType }) => tranType !== 'collectible');
    const bcxCollectiblesTxHistory = history.filter(({ tranType }) => tranType === 'collectible');

    const transactionsOnMainnet = activeBlockchainNetwork === BLOCKCHAIN_NETWORK_TYPES.BITCOIN
      ? history
      : mapTransactionsHistory(
        tokenTxHistory,
        contacts,
        contactsSmartAddresses,
        accounts,
        TRANSACTION_EVENT,
      );
    const collectiblesTransactions = mapOpenSeaAndBCXTransactionsHistory(openSeaTxHistory, bcxCollectiblesTxHistory);

    const mappedCTransactions = activeBlockchainNetwork === BLOCKCHAIN_NETWORK_TYPES.BITCOIN
      ? []
      : mapTransactionsHistory(
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
        icon: 'cube',
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
        icon: 'paperPlane',
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
        icon: 'cup',
        onPress: () => this.setActiveTab(SOCIAL),
        data: [...mappedContacts, ...invitations],
        emptyState: {
          title: 'Make your first step',
          bodyText: 'Information on your connections will appear here. Send a connection request to start.',
        },
      },
    ];

    const hasIntercomNotifications = !!intercomNotificationsCount;

    const badgesContainerStyle = !badges.length ? { width: '100%', justifyContent: 'center' } : {};
    const colors = getThemeColors(theme);

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
            centerItems: [{ custom: this.renderUser() }],
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
            sideFlex: 4,
          }}
          inset={{ bottom: 0 }}
          tab
        >
          {onScroll => (
            <ActivityFeed
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
              headerComponent={(
                <React.Fragment>
                  <WalletsPart handleWalletChange={this.handleWalletChange} isChanging={!!loaderMessage} />
                  <BadgesWrapper>
                    <ListHeader>Game of badges</ListHeader>
                    <FlatList
                      data={badges}
                      horizontal
                      keyExtractor={(item) => (item.id.toString())}
                      renderItem={this.renderBadge}
                      style={{ width: '100%', paddingBottom: spacing.medium }}
                      contentContainerStyle={{ paddingHorizontal: 6, ...badgesContainerStyle }}
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
                  {!!referralsFeatureEnabled && this.renderReferral(colors)}
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
        <ReferralModalReward
          isVisible={showRewardModal}
          onModalHide={this.handleModalHide}
        />
      </React.Fragment>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts, contactsSmartAddresses: { addresses: contactsSmartAddresses } },
  user: { data: user },
  invitations: { data: invitations },
  notifications: { intercomNotificationsCount },
  badges: { data: badges, badgesEvents },
  accounts: { data: accounts },
  userEvents: { data: userEvents },
  appSettings: { data: { baseFiatCurrency } },
  featureFlags: {
    data: {
      REFERRALS_ENABLED: referralsFeatureEnabled,
    },
  },
}: RootReducerState): $Shape<Props> => ({
  contacts,
  user,
  invitations,
  intercomNotificationsCount,
  badges,
  badgesEvents,
  contactsSmartAddresses,
  accounts,
  userEvents,
  baseFiatCurrency,
  referralsFeatureEnabled,
});

const structuredSelector = createStructuredSelector({
  history: accountHistorySelector,
  openSeaTxHistory: accountCollectiblesHistorySelector,
  activeBlockchainNetwork: activeBlockchainSelector,
});

const combinedMapStateToProps = (state: RootReducerState): $Shape<Props> => ({
  ...structuredSelector(state),
  ...mapStateToProps(state),
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  cancelInvitation: (invitation) => dispatch(cancelInvitationAction(invitation)),
  acceptInvitation: (invitation) => dispatch(acceptInvitationAction(invitation)),
  rejectInvitation: (invitation) => dispatch(rejectInvitationAction(invitation)),
  fetchTransactionsHistory: () => dispatch(fetchTransactionsHistoryAction()),
  fetchTransactionsHistoryNotifications: () => dispatch(fetchTransactionsHistoryNotificationsAction()),
  fetchInviteNotifications: () => dispatch(fetchInviteNotificationsAction()),
  setUnreadNotificationsStatus: status => dispatch(setUnreadNotificationsStatusAction(status)),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
  fetchBadges: () => dispatch(fetchBadgesAction()),
  logScreenView: (view: string, screen: string) => dispatch(logScreenViewAction(view, screen)),
  fetchBadgeAwardHistory: () => dispatch(fetchBadgeAwardHistoryAction()),
});

export default withTheme(connect(combinedMapStateToProps, mapDispatchToProps)(HomeScreen));
