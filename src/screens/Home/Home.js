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
import isEqual from 'lodash.isequal';
import type { NavigationScreenProp, NavigationEventSubscription } from 'react-navigation';
import firebase from 'react-native-firebase';
import { Animated, RefreshControl, Platform, View } from 'react-native';
import { Answers } from 'react-native-fabric';
import { createStructuredSelector } from 'reselect';
import Intercom from 'react-native-intercom';

import { PROFILE, CONTACT, BADGE } from 'constants/navigationConstants';
import { TYPE_ACCEPTED } from 'constants/invitationsConstants';

import ActivityFeed from 'components/ActivityFeed';
import styled from 'styled-components/native';
import { Container, Wrapper } from 'components/Layout';
import { BaseText, Paragraph } from 'components/Typography';
import Title from 'components/Title';
import PortfolioBalance from 'components/PortfolioBalance';
import {
  fetchTransactionsHistoryAction,
  fetchTransactionsHistoryNotificationsAction,
} from 'actions/historyActions';
import { setUnreadNotificationsStatusAction } from 'actions/notificationsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import {
  resetDeepLinkDataAction,
  approveLoginAttemptAction,
} from 'actions/deepLinkActions';
import IconButton from 'components/IconButton';
import Icon from 'components/Icon';
import ProfileImage from 'components/ProfileImage';
import BadgeImage from 'components/BadgeImage';
import Camera from 'components/Camera';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import Permissions from 'react-native-permissions';
import { baseColors, UIColors, fontSizes, fontWeights, spacing } from 'utils/variables';
import { mapTransactionsHistory, mapOpenSeaAndBCXTransactionsHistory } from 'utils/feedData';
import {
  cancelInvitationAction,
  acceptInvitationAction,
  rejectInvitationAction,
  fetchInviteNotificationsAction,
} from 'actions/invitationsActions';
import { fetchBadgesAction } from 'actions/badgesActions';
import { ALL, TRANSACTIONS, SOCIAL } from 'constants/activityConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import type { Badges } from 'models/Badge';
import { accountHistorySelector } from 'selectors/history';
import { accountCollectiblesHistorySelector } from 'selectors/collectibles';

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
  backupStatus: Object,
  fetchAllCollectiblesData: Function,
  deepLinkData: Object,
  resetDeepLinkData: Function,
  approveLoginAttempt: Function,
  fetchBadges: Function,
  badges: Badges,
  openSeaTxHistory: Object[],
  history: Array<*>,
};

type State = {
  showCamera: boolean,
  usernameWidth: number,
  activeTab: string,
  permissionsGranted: boolean,
  scrollY: Animated.Value,
  forceCloseLoginApprovalModal: boolean,
};

const profileImageWidth = 96;

const HomeHeader = styled.View`
  padding: 0 ${spacing.rhythm}px;
  margin-top: ${spacing.rhythm}px;
`;

const AnimatedHomeHeader = Animated.createAnimatedComponent(HomeHeader);

const HomeHeaderRow = styled.View`
  flex-direction: row;
`;

const HomeHeaderLeft = styled.View`
  flex: 0 0 40px;
  align-items: flex-start;
`;

const HomeHeaderRight = styled.View`
  flex: 0 0 40px;
  align-items: flex-end;
`;

const HomeHeaderBody = styled.View`
  flex: 1;
  align-items: center;
`;

const HomeHeaderImageUsername = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-bottom: -20px;
`;

const HomeHeaderUsername = styled(BaseText)`
  font-size: ${fontSizes.mediumLarge}px;
  line-height: ${fontSizes.mediumLarge}px;
  margin-top: 30px;
  max-width: 200px;
`;
const AnimatedHomeHeaderUsername = Animated.createAnimatedComponent(HomeHeaderUsername);

const HomeHeaderButton = styled(IconButton)`
  align-items: ${props => props.flexEnd ? 'flex-end' : 'flex-start'};
  margin: ${props => props.flexEnd ? `0 -${spacing.rhythm}px 0 0` : `0 0 0 -${spacing.rhythm}px`};
  padding: ${props => props.flexEnd ? `0 ${spacing.rhythm}px 0 0` : `0 0 0 ${spacing.rhythm}px`};
  width: 64px;
  height: 44px;
`;

const HomeHeaderProfileImage = styled(ProfileImage)`
  margin-bottom: -24px;
`;
const AnimatedHomeHeaderProfileImage = Animated.createAnimatedComponent(HomeHeaderProfileImage);

const HomeHeaderPortfolioBalance = styled(PortfolioBalance)`
  margin-bottom: 10px;
`;
const AnimatedHomeHeaderPortfolioBalance = Animated.createAnimatedComponent(HomeHeaderPortfolioBalance);

const RecentConnections = styled.View`
  height: 150px;
  border-bottom-width: 1px;
  border-style: solid;
  border-color: ${UIColors.defaultBorderColor};
`;

const RecentConnectionsWrapper = styled.View`
  shadow-color: ${baseColors.pigeonPost};
  shadow-radius: 6px;
  shadow-opacity: 0.15;
  shadow-offset: 0px 6px;
  padding-top: 124px;
`;

const RecentConnectionsSpacer = styled.View`
  min-height: 100px;
`;

const RecentConnectionsScrollView = styled.ScrollView`
  background-color: ${baseColors.snowWhite};
  padding-left: 6px;
  margin-top: -4px;
  padding-top: ${Platform.select({
    ios: '4px',
    android: 0,
  })};
`;

const RecentConnectionsItemProfileImage = styled(ProfileImage)`
  margin-bottom: ${spacing.rhythm / 2};
`;

const RecentConnectionsSubtitle = styled(Title)`
  margin-left: ${spacing.mediumLarge}px;
`;

const RecentConnectionsItem = styled.TouchableOpacity`
  align-items: center;
  width: ${Platform.select({
    ios: '60px',
    android: '74px',
  })};
  margin: ${Platform.select({
    ios: '4px 8px 24px',
    android: '0',
  })};
`;

const CameraIcon = styled(Icon)`
  font-size: ${fontSizes.extraLarge};
  color: ${baseColors.electricBlue};
`;

const RecentConnectionsItemName = styled(BaseText)`
  font-size: ${fontSizes.extraExtraSmall};
  color: ${baseColors.darkGray};
  padding: 0 4px;
  margin-top: ${Platform.select({
    ios: '4px',
    android: '-4px',
  })};
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

const BadgesWrapper = styled.View`
  padding-top: 0;
`;

const BadgesBlock = styled.View`
  height: 170px;
  border-bottom-width: 1px;
  border-style: solid;
  border-color: ${UIColors.defaultBorderColor};
`;

const BadgesSubtitle = styled(Title)`
  margin-left: ${spacing.mediumLarge}px;
`;

const BadgesScrollView = styled.ScrollView`
  background-color: ${baseColors.snowWhite};
  padding-left: 6px;
  margin-top: -4px;
  padding-top: ${Platform.select({
    ios: '4px',
    android: 0,
  })};
`;

const BadgesItem = styled.TouchableOpacity`
  align-items: center;
  width: 96px;
  margin: ${Platform.select({
    ios: '4px 4px 0',
    android: '0',
  })};
`;

const BadgesItemImage = styled(BadgeImage)`
  margin-bottom: ${spacing.rhythm / 2};
`;

const BadgesSpacer = styled.View`
  min-height: 0;
`;

const allIconNormal = require('assets/icons/all_normal.png');
const allIconActive = require('assets/icons/all_active.png');
const socialIconNormal = require('assets/icons/social_normal.png');
const socialIconActive = require('assets/icons/social_active.png');
const transactionsIconNormal = require('assets/icons/transactions_normal.png');
const transactionsIconActive = require('assets/icons/transactions_active.png');

class HomeScreen extends React.Component<Props, State> {
  _willFocus: NavigationEventSubscription;

  state = {
    forceCloseLoginApprovalModal: false,
    showCamera: false,
    permissionsGranted: false,
    scrollY: new Animated.Value(0),
    activeTab: ALL,
    usernameWidth: 0,
  };

  componentDidMount() {
    const { fetchTransactionsHistory } = this.props;

    Answers.logContentView('Home screen');

    if (Platform.OS === 'ios') {
      firebase.notifications().setBadge(0);
    }

    // TODO: remove this when notifications service becomes reliable
    fetchTransactionsHistory();

    this._willFocus = this.props.navigation.addListener(
      'willFocus',
      () => { this.props.setUnreadNotificationsStatus(false); },
    );
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

  goToProfile = () => {
    const { navigation } = this.props;
    navigation.navigate(PROFILE);
  };

  openCamera = async () => {
    const statusPhoto = await Permissions.request('photo');
    const statusCamera = await Permissions.request('camera');
    this.setState({
      permissionsGranted: statusPhoto === 'authorized' && statusCamera === 'authorized',
      showCamera: true,
    });
  };

  closeCamera = () => {
    this.setState({
      showCamera: false,
    });
  };

  renderRecentConnections = () => {
    const { contacts, navigation } = this.props;
    return contacts
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10)
      .map(contact => {
        const profileImage = contact.lastUpdateTime
          ? `${contact.profileImage}?t=${contact.lastUpdateTime}`
          : contact.profileImage;

        return (
          <RecentConnectionsItem
            key={contact.username}
            onPress={() => navigation.navigate(CONTACT, { contact })}
          >
            <RecentConnectionsItemProfileImage
              uri={profileImage}
              userName={contact.username}
              diameter={52}
            />
            <RecentConnectionsItemName numberOfLines={1}>{contact.username}</RecentConnectionsItemName>
          </RecentConnectionsItem>
        );
      });
  };

  renderBadges = () => {
    const { badges, navigation } = this.props;
    return badges
      .sort((a, b) => (b.receivedAt || 0) - (a.receivedAt || 0))
      .map(badge => (
        <BadgesItem key={badge.id} onPress={() => navigation.navigate(BADGE, { id: badge.id })}>
          <BadgesItemImage data={badge} />
        </BadgesItem>
      ));
  };

  refreshScreenData = () => {
    const {
      fetchTransactionsHistoryNotifications,
      fetchInviteNotifications,
      fetchAllCollectiblesData,
      fetchBadges,
    } = this.props;
    fetchTransactionsHistoryNotifications();
    fetchInviteNotifications();
    fetchAllCollectiblesData();
    fetchBadges();
  };

  setActiveTab = (activeTab) => {
    this.setState({ activeTab });
  };

  goToProfileEmailSettings = () => {
    const { navigation } = this.props;
    this.setState({ forceCloseLoginApprovalModal: true }, () => {
      /**
       * NOTE: `forceCloseLoginApprovalModal` needs reset because
       * after: (1) navigating to email settings with login token to approve
       * then (2) saving email and (3) closing email modal should have
       * login approve modal open in Home screen, however,
       * login approve modal cannot be open while navigating
       */
      this.setState({ forceCloseLoginApprovalModal: false });
      navigation.navigate(PROFILE, { visibleModal: 'email' });
    });
  };

  render() {
    const {
      user,
      cancelInvitation,
      acceptInvitation,
      rejectInvitation,
      intercomNotificationsCount,
      navigation,
      backupStatus,
      deepLinkData,
      resetDeepLinkData,
      approveLoginAttempt,
      badges,
      history,
      openSeaTxHistory,
      contacts,
    } = this.props;
    const {
      showCamera,
      permissionsGranted,
      scrollY,
      usernameWidth,
      forceCloseLoginApprovalModal,
    } = this.state;

    const {
      isImported,
      isBackedUp,
    } = backupStatus;

    const profileUsernameTranslateX = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [-profileImageWidth / 2, -30],
      extrapolate: 'clamp',
    });

    const profileUsernameTranslateY = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [12, -94],
      extrapolate: 'clamp',
    });

    const profileImagePositionX = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [(usernameWidth / 2), 10],
      extrapolate: 'clamp',
    });

    const profileImagePositionY = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [-60, -72],
      extrapolate: 'clamp',
    });

    const profileImageScale = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [1, 0.375],
      extrapolate: 'clamp',
    });

    const profileBalanceScale = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [1, 0.8],
      extrapolate: 'clamp',
    });

    const usernameScale = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [1, 0.8],
      extrapolate: 'clamp',
    });

    const profileBalancePositionY = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [24, -120],
      extrapolate: 'clamp',
    });

    const profileBalanceOpacity = scrollY.interpolate({
      inputRange: [0, 20, 100],
      outputRange: [1, 0, 0],
      extrapolate: 'clamp',
    });

    const tokenTxHistory = history.filter(({ tranType }) => tranType !== 'collectible');
    const bcxCollectiblesTxHistory = history.filter(({ tranType }) => tranType === 'collectible');

    const transactionsOnMainnet = mapTransactionsHistory(tokenTxHistory, contacts, TRANSACTION_EVENT);
    const collectiblesTransactions = mapOpenSeaAndBCXTransactionsHistory(openSeaTxHistory, bcxCollectiblesTxHistory);
    const mappedCTransactions = mapTransactionsHistory(collectiblesTransactions, contacts, TRANSACTION_EVENT);

    const mappedContacts = contacts.map(({ ...rest }) => ({ ...rest, type: TYPE_ACCEPTED }));

    const activityFeedTabs = [
      {
        id: ALL,
        name: 'All',
        tabImageNormal: allIconNormal,
        tabImageActive: allIconActive,
        onPress: () => this.setActiveTab(ALL),
        data: [...transactionsOnMainnet, ...mappedCTransactions, ...mappedContacts],
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
        data: mappedContacts,
        emptyState: {
          title: 'Make your first step',
          body: 'Information on your connections will appear here. Send a connection request to start.',
        },
      },
    ];

    const hasIntercomNotifications = !!intercomNotificationsCount;
    const isWalletBackedUp = isImported || isBackedUp;

    const { loginAttemptToken } = deepLinkData;

    return (
      <Container color={baseColors.snowWhite} inset={{ bottom: 0 }}>
        <AnimatedHomeHeader>
          <HomeHeaderRow>
            <HomeHeaderLeft>
              <HomeHeaderButton
                icon="help"
                color={baseColors.darkGray}
                fontSize={24}
                onPress={() => Intercom.displayMessenger()}
              />
              {hasIntercomNotifications && <View
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: baseColors.sunYellow,
                  borderRadius: 4,
                  position: 'absolute',
                  top: 6,
                  right: 8,
                }}
              />}
            </HomeHeaderLeft>
            <HomeHeaderBody />
            <HomeHeaderRight>
              {!isWalletBackedUp && <View
                style={{
                  width: 8,
                  height: 8,
                  backgroundColor: baseColors.burningFire,
                  borderRadius: 4,
                  position: 'absolute',
                  top: 6,
                  right: -6,
                }}
              />}
              <HomeHeaderButton
                flexEnd
                icon="settings"
                color={baseColors.darkGray}
                fontSize={24}
                onPress={() => this.goToProfile()}
              />
            </HomeHeaderRight>
          </HomeHeaderRow>
          <HomeHeaderRow>
            <HomeHeaderBody>
              <HomeHeaderImageUsername>
                <AnimatedHomeHeaderProfileImage
                  uri={`${user.profileImage}?t=${user.lastUpdateTime || 0}`}
                  userName={user.username}
                  diameter={profileImageWidth}
                  onPress={this.openCamera}
                  style={{
                    transform: [
                      { translateY: profileImagePositionY },
                      { translateX: profileImagePositionX },
                      { scale: profileImageScale },
                      { perspective: 1000 },
                    ],
                  }}
                  borderWidth={user.profileImage ? 0 : 2}
                  containerStyle={{
                    borderRadius: user.profileImage ? 0 : profileImageWidth / 2,
                    backgroundColor: user.profileImage ? 'transparent' : baseColors.lightGray,
                  }}
                  noShadow
                >
                  <CameraIcon name="camera" />
                </AnimatedHomeHeaderProfileImage>
                <AnimatedHomeHeaderUsername
                  ellipsizeMode="tail"
                  numberOfLines={2}
                  onLayout={(event) => {
                    const { width } = event.nativeEvent.layout;
                    this.setState({
                      usernameWidth: width,
                    });
                  }}
                  style={{
                    transform: [
                      { scale: usernameScale },
                      { translateX: profileUsernameTranslateX },
                      { translateY: profileUsernameTranslateY },
                    ],
                  }}
                >
                  {user.username}
                </AnimatedHomeHeaderUsername>
              </HomeHeaderImageUsername>
              <AnimatedHomeHeaderPortfolioBalance
                style={{
                  transform: [
                    { scale: profileBalanceScale },
                    { translateY: profileBalancePositionY },
                  ],
                  opacity: profileBalanceOpacity,
                }}
              />
            </HomeHeaderBody>
          </HomeHeaderRow>
        </AnimatedHomeHeader>
        <Animated.ScrollView
          stickyHeaderIndices={[3]}
          style={{
            marginTop: this.props.contacts.length ? -100 : -76,
          }}
          onScroll={Animated.event(
            [
              {
                nativeEvent: {
                  contentOffset: { y: scrollY },
                },
              },
            ],
            { useNativeDriver: true },
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={this.refreshScreenData}
            />
          }
        >
          {this.props.contacts.length ?
            <RecentConnectionsWrapper>
              <RecentConnections>
                <View style={{ backgroundColor: baseColors.snowWhite }}>
                  <RecentConnectionsSubtitle subtitle title="recent connections." />
                </View>
                <RecentConnectionsScrollView horizontal nestedScrollEnabled overScrollMode="always">
                  {this.renderRecentConnections()}
                </RecentConnectionsScrollView>
              </RecentConnections>
            </RecentConnectionsWrapper> :

            <RecentConnectionsSpacer />
          }
          {badges && badges.length ?
            <BadgesWrapper>
              <BadgesBlock>
                <View style={{ backgroundColor: baseColors.snowWhite }}>
                  <BadgesSubtitle subtitle title="game of badges." />
                </View>
                <BadgesScrollView horizontal nestedScrollEnabled overScrollMode="always">
                  {this.renderBadges()}
                </BadgesScrollView>
              </BadgesBlock>
            </BadgesWrapper> :

            <BadgesSpacer />
          }
          <ActivityFeed
            backgroundColor={baseColors.white}
            onCancelInvitation={cancelInvitation}
            onRejectInvitation={rejectInvitation}
            onAcceptInvitation={acceptInvitation}
            navigation={navigation}
            activeTab={this.state.activeTab}
            feedTitle="your activity."
            tabs={activityFeedTabs}
          />
        </Animated.ScrollView>
        <Camera
          isVisible={showCamera}
          modalHide={this.closeCamera}
          permissionsGranted={permissionsGranted}
          navigation={navigation}
        />
        <SlideModal
          isVisible={!!loginAttemptToken && !forceCloseLoginApprovalModal}
          fullScreen
          showHeader
          onModalHide={resetDeepLinkData}
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
              { !user.email &&
                <DescriptionWarning>
                  In order to proceed with Discourse login you must have email added to your profile.
                </DescriptionWarning>
              }
              <Button
                title={!user.email ? 'Add your email' : 'Confirm login'}
                onPress={() => user.email
                  ? approveLoginAttempt(loginAttemptToken)
                  : this.goToProfileEmailSettings()
                }
                style={{
                  marginBottom: 13,
                }}
              />
            </View>
          </Wrapper>
        </SlideModal>
      </Container>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
  user: { data: user },
  invitations: { data: invitations },
  wallet: { backupStatus },
  notifications: { intercomNotificationsCount },
  deepLink: { data: deepLinkData },
  badges: { data: badges },
}) => ({
  contacts,
  user,
  invitations,
  intercomNotificationsCount,
  backupStatus,
  deepLinkData,
  badges,
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
  fetchTransactionsHistoryNotifications: () => dispatch(fetchTransactionsHistoryNotificationsAction()),
  fetchTransactionsHistory: () => dispatch(fetchTransactionsHistoryAction()),
  fetchInviteNotifications: () => dispatch(fetchInviteNotificationsAction()),
  setUnreadNotificationsStatus: (status) => dispatch(setUnreadNotificationsStatusAction(status)),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
  resetDeepLinkData: () => dispatch(resetDeepLinkDataAction()),
  approveLoginAttempt: loginAttemptToken => dispatch(approveLoginAttemptAction(loginAttemptToken)),
  fetchBadges: () => dispatch(fetchBadgesAction()),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(HomeScreen);
