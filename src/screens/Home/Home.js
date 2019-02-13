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
import { PROFILE, CONTACT } from 'constants/navigationConstants';
import ActivityFeed from 'components/ActivityFeed';
import styled from 'styled-components/native';
import { Container } from 'components/Layout';
import Intercom from 'react-native-intercom';
import { BaseText } from 'components/Typography';
import Title from 'components/Title';
import PortfolioBalance from 'components/PortfolioBalance';
import {
  fetchTransactionsHistoryAction,
  fetchTransactionsHistoryNotificationsAction,
} from 'actions/historyActions';
import { setUnreadNotificationsStatusAction } from 'actions/notificationsActions';
import IconButton from 'components/IconButton';
import Tabs from 'components/Tabs';
import Icon from 'components/Icon';
import ProfileImage from 'components/ProfileImage';
import Camera from 'components/Camera';
import Permissions from 'react-native-permissions';
import { baseColors, UIColors, fontSizes, spacing } from 'utils/variables';
import {
  cancelInvitationAction,
  acceptInvitationAction,
  rejectInvitationAction,
  fetchInviteNotificationsAction,
} from 'actions/invitationsActions';
import { ALL, TRANSACTIONS, SOCIAL } from 'constants/activityConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  contacts: Object[],
  invitations: Object[],
  history: Object[],
  user: Object,
  wallet: Object,
  fetchTransactionsHistoryNotifications: Function,
  fetchTransactionsHistory: (walletAddress: string) => Function,
  fetchInviteNotifications: Function,
  acceptInvitation: Function,
  cancelInvitation: Function,
  rejectInvitation: Function,
  setUnreadNotificationsStatus: Function,
  homeNotifications: Object[],
  intercomNotificationsCount: number,
  backupStatus: Object,
};

type esDataType = {
  title: string,
  body: string,
}
type State = {
  showCamera: boolean,
  usernameWidth: number,
  activeTab: string,
  esData: esDataType,
  permissionsGranted: boolean,
  scrollY: Animated.Value,
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

const TabsHeader = styled.View`
  padding: 20px ${spacing.mediumLarge}px 12px;
  background-color: ${baseColors.white};
`;

class HomeScreen extends React.Component<Props, State> {
  _willFocus: NavigationEventSubscription;

  state = {
    showCamera: false,
    permissionsGranted: false,
    scrollY: new Animated.Value(0),
    activeTab: ALL,
    usernameWidth: 0,
    esData: {
      title: 'Make your first step',
      body: 'Your activity will appear here.',
    },
  };

  componentDidMount() {
    const { fetchTransactionsHistory, wallet } = this.props;

    if (Platform.OS === 'ios') {
      firebase.notifications().setBadge(0);
    }

    // TODO: remove this when notifications service becomes reliable
    fetchTransactionsHistory(wallet.address);

    this._willFocus = this.props.navigation.addListener(
      'willFocus',
      () => { this.props.setUnreadNotificationsStatus(false); },
    );
  }

  componentWillUnmount() {
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

  refreshScreenData = () => {
    const {
      fetchTransactionsHistoryNotifications,
      fetchInviteNotifications,
    } = this.props;
    fetchTransactionsHistoryNotifications();
    fetchInviteNotifications();
  };

  setActiveTab = (activeTab, esData?) => {
    this.setState({
      activeTab,
      esData,
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
    } = this.props;
    const {
      showCamera,
      permissionsGranted,
      scrollY,
      esData,
      usernameWidth,
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

    const activityFeedTabs = [
      {
        id: ALL,
        name: 'All',
        icon: 'all',
        onPress: () => this.setActiveTab(ALL),
      },
      {
        id: TRANSACTIONS,
        name: 'Transactions',
        icon: 'send',
        onPress: () => this.setActiveTab(
          TRANSACTIONS,
          {
            title: 'Make your first step',
            body: 'Your transactions will appear here. Send or receive tokens to start.',
          },
        ),
      },
      {
        id: SOCIAL,
        name: 'Social',
        icon: 'social',
        onPress: () => this.setActiveTab(
          SOCIAL,
          {
            title: 'Make your first step',
            body: 'Information on your connections will appear here. Send a connection request to start.',
          },
        ),
      },
    ];

    const hasIntercomNotifications = !!intercomNotificationsCount;
    const isWalletBackedUp = isImported || isBackedUp;

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
          stickyHeaderIndices={[2]}
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
          <TabsHeader>
            <Title subtitle noMargin title="your activity." />
          </TabsHeader>
          <Tabs tabs={activityFeedTabs} />
          <ActivityFeed
            backgroundColor={baseColors.white}
            onCancelInvitation={cancelInvitation}
            onRejectInvitation={rejectInvitation}
            onAcceptInvitation={acceptInvitation}
            navigation={navigation}
            activeTab={this.state.activeTab}
            esData={esData}
            sortable
            showEmptyState
          />
        </Animated.ScrollView>
        <Camera
          isVisible={showCamera}
          modalHide={this.closeCamera}
          permissionsGranted={permissionsGranted}
          navigation={navigation}
        />
      </Container>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
  user: { data: user },
  history: { data: history },
  invitations: { data: invitations },
  wallet: { data: wallet, backupStatus },
  notifications: { intercomNotificationsCount },
}) => ({
  contacts,
  user,
  history,
  invitations,
  wallet,
  intercomNotificationsCount,
  backupStatus,
});

const mapDispatchToProps = (dispatch) => ({
  cancelInvitation: (invitation) => dispatch(cancelInvitationAction(invitation)),
  acceptInvitation: (invitation) => dispatch(acceptInvitationAction(invitation)),
  rejectInvitation: (invitation) => dispatch(rejectInvitationAction(invitation)),
  fetchTransactionsHistoryNotifications: () => dispatch(fetchTransactionsHistoryNotificationsAction()),
  fetchTransactionsHistory: (walletAddress) => dispatch(fetchTransactionsHistoryAction(walletAddress)),
  fetchInviteNotifications: () => dispatch(fetchInviteNotificationsAction()),
  setUnreadNotificationsStatus: (status) => dispatch(setUnreadNotificationsStatusAction(status)),
});

export default connect(mapStateToProps, mapDispatchToProps)(HomeScreen);
