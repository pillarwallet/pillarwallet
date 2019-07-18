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
import { Animated, RefreshControl, Platform, View } from 'react-native';
import { connect } from 'react-redux';
import isEqual from 'lodash.isequal';
import type { NavigationScreenProp, NavigationEventSubscription } from 'react-navigation';
import firebase from 'react-native-firebase';
import { Answers } from 'react-native-fabric';
import { createStructuredSelector } from 'reselect';
import Intercom from 'react-native-intercom';
import Permissions from 'react-native-permissions';

// components
import ActivityFeed from 'components/ActivityFeed';
import styled from 'styled-components/native';
import { Container, Wrapper } from 'components/Layout';
import { BaseText, BoldText, Paragraph } from 'components/Typography';
import Title from 'components/Title';
import PortfolioBalance from 'components/PortfolioBalance';
import IconButton from 'components/IconButton';
import Icon from 'components/Icon';
import Tabs from 'components/Tabs';
import ProfileImage from 'components/ProfileImage';
import Camera from 'components/Camera';
import SlideModal from 'components/Modals/SlideModal';
import Button from 'components/Button';
import CircleButton from 'components/CircleButton';
import QRCodeScanner from 'components/QRCodeScanner';
import ButtonText from 'components/ButtonText';
import Spinner from 'components/Spinner';
import SettingsListItem from 'components/ListItem/SettingsItem';

// constants
import { PROFILE, CONTACT, MANAGE_DETAILS_SESSIONS } from 'constants/navigationConstants';
import { ALL, TRANSACTIONS, SOCIAL } from 'constants/activityConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';
import { COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import { TYPE_ACCEPTED } from 'constants/invitationsConstants';

// actions
import { fetchTransactionsHistoryAction, fetchTransactionsHistoryNotificationsAction } from 'actions/historyActions';
import { setUnreadNotificationsStatusAction } from 'actions/notificationsActions';
import { fetchAllCollectiblesDataAction } from 'actions/collectiblesActions';
import { resetDeepLinkDataAction, approveLoginAttemptAction, executeDeepLinkAction } from 'actions/deepLinkActions';
import {
  cancelInvitationAction,
  acceptInvitationAction,
  rejectInvitationAction,
  fetchInviteNotificationsAction,
} from 'actions/invitationsActions';
import {
  onWalletConnectSessionRequest,
  cancelWaitingRequest,
} from 'actions/walletConnectActions';

// selectors
import { accountHistorySelector } from 'selectors/history';
import { accountCollectiblesHistorySelector } from 'selectors/collectibles';

// utils
import { baseColors, UIColors, fontSizes, fontWeights, spacing } from 'utils/variables';
import { mapTransactionsHistory, mapOpenSeaAndBCXTransactionsHistory } from 'utils/feedData';

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
  resetDeepLinkData: Function,
  approveLoginAttempt: Function,
  openSeaTxHistory: Object[],
  history: Array<*>,
  waitingRequest?: string,
  onWalletConnectSessionRequest: Function,
  onWalletLinkScan: Function,
  cancelWaitingRequest: Function,
  loginAttemptToken?: string,
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
  align-items: ${props => (props.flexEnd ? 'flex-end' : 'flex-start')};
  margin: ${props => (props.flexEnd ? `0 -${spacing.rhythm}px 0 0` : `0 0 0 -${spacing.rhythm}px`)};
  padding: ${props => (props.flexEnd ? `0 ${spacing.rhythm}px 0 0` : `0 0 0 ${spacing.rhythm}px`)};
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

const StyledSubtitle = styled(Title)`
  margin: ${spacing.medium}px ${spacing.mediumLarge}px;
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

const SessionUIWrapper = styled.View`
  padding-top: 110px;

`;

export const StatusMessage = styled(BoldText)`
  padding-top: 10px;
`;

export const LoadingSpinner = styled(Spinner)`
  padding: 10px;
  align-items: center;
  justify-content: center;
`;

export const ItemWrapper = styled.View`
  margin-top: ${spacing.large}px;
  border-bottom-width: 1px;
  border-top-width: 1px;
  border-color: ${baseColors.mediumLightGray};
`;

const TabsHeader = styled.View`
  padding: ${spacing.medium}px ${spacing.mediumLarge}px;
  background-color: ${baseColors.white};
`;

const allIconNormal = require('assets/icons/all_normal.png');
const allIconActive = require('assets/icons/all_active.png');
const socialIconNormal = require('assets/icons/social_normal.png');
const socialIconActive = require('assets/icons/social_active.png');
const transactionsIconNormal = require('assets/icons/transactions_normal.png');
const transactionsIconActive = require('assets/icons/transactions_active.png');
const iconReceive = require('assets/icons/icon_receive.png');

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
    const { fetchTransactionsHistory } = this.props;

    Answers.logContentView('Home screen');

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
          <RecentConnectionsItem key={contact.username} onPress={() => navigation.navigate(CONTACT, { contact })}>
            <RecentConnectionsItemProfileImage uri={profileImage} userName={contact.username} diameter={52} />
            <RecentConnectionsItemName numberOfLines={1}>{contact.username}</RecentConnectionsItemName>
          </RecentConnectionsItem>
        );
      });
  };

  refreshScreenData = () => {
    const {
      fetchTransactionsHistoryNotifications,
      fetchInviteNotifications,
      fetchAllCollectiblesData,
    } = this.props;
    fetchTransactionsHistoryNotifications();
    fetchInviteNotifications();
    fetchAllCollectiblesData();
  };

  setActiveTab = (activeTab) => {
    this.setState({ activeTab });
  };

  goToProfileEmailSettings = () => {
    this.setState({ showLoginModal: false });
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
      navigation.navigate(PROFILE, { visibleModal: 'email' });
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

  renderNewSession() {
    const { waitingRequest } = this.props;

    if (waitingRequest) {
      return (
        <View>
          <StatusMessage>
            Adding session...
          </StatusMessage>
          <LoadingSpinner />
          <ButtonText
            buttonText="Cancel"
            onPress={this.cancelWaiting}
          />
        </View>
      );
    }

    return (
      <CircleButton label="New Session" icon={iconReceive} onPress={this.toggleQRScanner} />
    );
  }
  // END OF Wallet connect related methods

  render() {
    const {
      user,
      cancelInvitation,
      acceptInvitation,
      rejectInvitation,
      intercomNotificationsCount,
      navigation,
      backupStatus,
      loginAttemptToken,
      approveLoginAttempt,
      history,
      openSeaTxHistory,
      contacts,
      invitations,
    } = this.props;

    const {
      showCamera,
      permissionsGranted,
      scrollY,
      usernameWidth,
      activeTab,
      isScanning,
      showLoginModal,
    } = this.state;

    const { isImported, isBackedUp } = backupStatus;

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
    const isWalletBackedUp = isImported || isBackedUp;

    // getting from navigation params solves case when forum login approve modal should appear after PIN screen
    const isLoginModalVisible = showLoginModal || navigation.getParam('showLoginApproveModal');

    return (
      <Container color={baseColors.white} inset={{ bottom: 0 }}>
        <AnimatedHomeHeader>
          <HomeHeaderRow>
            <HomeHeaderLeft>
              <HomeHeaderButton
                icon="help"
                color={baseColors.darkGray}
                fontSize={24}
                onPress={() => Intercom.displayMessenger()}
              />
              {hasIntercomNotifications && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: baseColors.sunYellow,
                    borderRadius: 4,
                    position: 'absolute',
                    top: 6,
                    right: 8,
                  }}
                />
              )}
            </HomeHeaderLeft>
            <HomeHeaderBody />
            <HomeHeaderRight>
              {!isWalletBackedUp && (
                <View
                  style={{
                    width: 8,
                    height: 8,
                    backgroundColor: baseColors.burningFire,
                    borderRadius: 4,
                    position: 'absolute',
                    top: 6,
                    right: -6,
                  }}
                />
              )}
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
                  onLayout={event => {
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
                  transform: [{ scale: profileBalanceScale }, { translateY: profileBalancePositionY }],
                  opacity: profileBalanceOpacity,
                }}
              />
            </HomeHeaderBody>
          </HomeHeaderRow>
        </AnimatedHomeHeader>
        <Animated.ScrollView
          stickyHeaderIndices={contacts.length ? [3] : [2]}
          style={{
            marginTop: contacts.length ? -100 : -76,
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
          refreshControl={<RefreshControl refreshing={false} onRefresh={this.refreshScreenData} />}
        >
          <SessionUIWrapper>
            {this.renderNewSession()}
            <ItemWrapper>
              <SettingsListItem
                key="manage_sessions"
                label="Manage sessions"
                onPress={() => navigation.navigate(MANAGE_DETAILS_SESSIONS)}
                wrapperPaddingHorizontal={spacing.mediumLarge}
              />
              {/* <SettingsListItem */}
              {/* key="send_wyre" */}
              {/* label="Send Wyre" */}
              {/* onPress={() => navigation.navigate(FIAT_CRYPTO)} */}
              {/* wrapperPaddingHorizontal={spacing.mediumLarge} */}
              {/* /> */}
            </ItemWrapper>
          </SessionUIWrapper>
          {!!contacts.length &&
            <RecentConnectionsWrapper>
              <RecentConnections>
                <View style={{ backgroundColor: baseColors.snowWhite }}>
                  <StyledSubtitle noMargin subtitle title="recent connections." />
                </View>
                <RecentConnectionsScrollView horizontal nestedScrollEnabled overScrollMode="always">
                  {this.renderRecentConnections()}
                </RecentConnectionsScrollView>
              </RecentConnections>
            </RecentConnectionsWrapper>
          }
          <TabsHeader>
            <Title subtitle noMargin title="your activity." />
          </TabsHeader>
          <Tabs tabs={activityFeedTabs} coverColor={baseColors.white} />
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
          />
        </Animated.ScrollView>

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
        <Camera
          isVisible={showCamera}
          modalHide={this.closeCamera}
          permissionsGranted={permissionsGranted}
          navigation={navigation}
        />
        <QRCodeScanner
          validator={this.validateWalletConnectQRCode}
          isActive={isScanning}
          onDismiss={this.handleQRScannerClose}
          onRead={this.handleQRRead}
          onModalHide={this.checkLoginModalVisibility}
        />
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
  deepLink: { data: { loginAttemptToken } = {} },
}) => ({
  contacts,
  user,
  invitations,
  intercomNotificationsCount,
  backupStatus,
  loginAttemptToken,
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
  setUnreadNotificationsStatus: status => dispatch(setUnreadNotificationsStatusAction(status)),
  fetchAllCollectiblesData: () => dispatch(fetchAllCollectiblesDataAction()),
  resetDeepLinkData: () => dispatch(resetDeepLinkDataAction()),
  approveLoginAttempt: loginAttemptToken => dispatch(approveLoginAttemptAction(loginAttemptToken)),
  onWalletConnectSessionRequest: uri => dispatch(onWalletConnectSessionRequest(uri)),
  onWalletLinkScan: uri => dispatch(executeDeepLinkAction(uri)),
  cancelWaitingRequest: clientId => dispatch(cancelWaitingRequest(clientId)),
});

export default connect(combinedMapStateToProps, mapDispatchToProps)(HomeScreen);

