// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp, NavigationEventSubscription } from 'react-navigation';
import LinearGradient from 'react-native-linear-gradient';
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
import { fetchTransactionsHistoryNotificationsAction } from 'actions/historyActions';
import { setUnreadNotificationsStatusAction } from 'actions/notificationsActions';
import IconButton from 'components/IconButton';
import Tabs from 'components/Tabs';
import Icon from 'components/Icon';
import ProfileImage from 'components/ProfileImage';
import Camera from 'components/Camera';
import Permissions from 'react-native-permissions';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import { baseColors, fontSizes, spacing } from 'utils/variables';
import {
  cancelInvitationAction,
  acceptInvitationAction,
  rejectInvitationAction,
  fetchInviteNotificationsAction,
} from 'actions/invitationsActions';
import { getExistingChatsAction } from 'actions/chatActions';
import { ALL, TRANSACTIONS, SOCIAL } from 'constants/activityConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  contacts: Object[],
  invitations: Object[],
  historyNotifications: Object[],
  history: Object[],
  user: Object,
  wallet: Object,
  fetchTransactionsHistoryNotifications: Function,
  fetchInviteNotifications: Function,
  acceptInvitation: Function,
  cancelInvitation: Function,
  rejectInvitation: Function,
  setUnreadNotificationsStatus: Function,
  homeNotifications: Object[],
  getExistingChats: Function,
  intercomNotificationsCount: number,
  chats: any,
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

const profileImageWidth = 72;

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

const HomeHeaderProfileImage = styled(ProfileImage)`
`;

const HomeHeaderImageUsername = styled.View`
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-bottom: -20px;
`;

const HomeHeaderUsername = styled(BaseText)`
  font-size: ${fontSizes.mediumLarge};
`;
const AnimatedHomeHeaderUsername = Animated.createAnimatedComponent(HomeHeaderUsername);

const HomeHeaderButton = styled(IconButton)`
  align-items: ${props => props.flexEnd ? 'flex-end' : 'flex-start'};
  margin: ${props => props.flexEnd ? `0 -${spacing.rhythm}px 0 0` : `0 0 0 -${spacing.rhythm}px`};
  padding: ${props => props.flexEnd ? `0 ${spacing.rhythm}px 0 0` : `0 0 0 ${spacing.rhythm}px`};
  width: 64px;
  height: 44px;
`;


const AnimatedHomeHeaderProfileImage = Animated.createAnimatedComponent(HomeHeaderProfileImage);

const HomeHeaderPortfolioBalance = styled(PortfolioBalance)`
  margin-bottom: 10px;
`;
const AnimatedHomeHeaderPortfolioBalance = Animated.createAnimatedComponent(HomeHeaderPortfolioBalance);

const RecentConnections = styled.View`
  min-height: 160px;
  border-bottom-width: 1px;
  border-style: solid;
  margin-top: 100px;
  background-color: ${baseColors.white};
  border-color: ${baseColors.duckEggBlue};
`;

const RecentConnectionsWrapper = styled.View`
  shadow-color: ${baseColors.pigeonPost};
  shadow-radius: 6px;
  shadow-opacity: 0.15;
  shadow-offset: 0px 6px;
`;

const RecentConnectionsScrollView = styled.ScrollView``;

const RecentConnectionsItemProfileImage = styled(ProfileImage)`
  margin-bottom: ${spacing.rhythm / 2};
`;

const RecentConnectionsSubtitle = styled(Title)`
  margin-left: ${spacing.rhythm}px;
`;

const RecentConnectionsItem = styled.TouchableOpacity`
  align-items: center;
  width: 64px;
  margin: 0 8px;
`;

const CameraIcon = styled(Icon)`
  font-size: ${fontSizes.extraLarge};
  color: ${baseColors.electricBlue};
`;

const RecentConnectionsItemName = styled(BaseText)`
  font-size: ${fontSizes.small};
  color: ${baseColors.darkGray};
`;

const EmptyStateWrapper = styled.View`
  align-items: center;
  justify-content: center;
  width: 100%;
  margin: 6px 0 8px 0;
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
    const { fetchInviteNotifications } = this.props;
    fetchInviteNotifications();
    if (Platform.OS === 'ios') {
      firebase.notifications().setBadge(0);
    }
    this._willFocus = this.props.navigation.addListener(
      'willFocus',
      () => { this.props.setUnreadNotificationsStatus(false); },
    );
  }

  componentWillUnmount() {
    this._willFocus.remove();
  }

  goToProfile = () => {
    const { navigation } = this.props;
    navigation.navigate(PROFILE);
  };

  toggleCamera = async () => {
    const status = await Permissions.request('photo');
    this.setState({
      permissionsGranted: status === 'authorized',
      showCamera: !this.state.showCamera,
    });
  }

  renderRecentConnections = () => {
    const { contacts, navigation } = this.props;
    return contacts
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10)
      .map(contact => (
        <RecentConnectionsItem
          key={contact.username}
          onPress={() => navigation.navigate(CONTACT, { contact })}
        >
          <RecentConnectionsItemProfileImage
            uri={contact.profileImage}
            userName={contact.username}
            diameter={52}
          />
          <RecentConnectionsItemName numberOfLines={1}>{contact.username}</RecentConnectionsItemName>
        </RecentConnectionsItem>
      ));
  };

  renderEmptyRCState = () => {
    return (
      <EmptyStateWrapper>
        <EmptyStateParagraph
          title="Chat with someone"
          bodyText="Recent contacts live here. Get quick access to encrypted chat."
        />
      </EmptyStateWrapper>
    );
  };
  refreshScreenData = () => {
    const {
      fetchTransactionsHistoryNotifications,
      fetchInviteNotifications,
      getExistingChats,
    } = this.props;
    fetchTransactionsHistoryNotifications();
    fetchInviteNotifications();
    getExistingChats();
  };

  setActiveTab = (activeTab, esData?) => {
    this.setState({
      activeTab,
      esData,
    });
  }

  render() {
    const {
      user,
      cancelInvitation,
      acceptInvitation,
      rejectInvitation,
      intercomNotificationsCount,
      navigation,
    } = this.props;
    const {
      showCamera,
      permissionsGranted,
      scrollY,
      esData,
      usernameWidth,
    } = this.state;

    const profileUsernameTranslateX = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [-profileImageWidth / 2, -20],
      extrapolate: 'clamp',
    });

    const profileUsernameTranslateY = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [0, -60],
      extrapolate: 'clamp',
    });

    const profileImagePositionX = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [(usernameWidth / 2), -10],
      extrapolate: 'clamp',
    });

    const profileImagePositionY = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [-60, -60],
      extrapolate: 'clamp',
    });

    const profileImageScale = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [1, 0.5],
      extrapolate: 'clamp',
    });

    const profileBalanceScale = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [1, 0.8],
      extrapolate: 'clamp',
    });

    const profileBalancePositionY = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [0, -120],
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

    const stickyHeaderIndices = Platform.OS === 'android' ? null : [1];
    const hasIntercomNotifications = !!intercomNotificationsCount;
    return (
      <Container>
        <LinearGradient
          colors={['rgba(255,255,255,1)', 'rgba(255,255,255,1)', 'rgba(255,255,255,0.5)', 'rgba(255,255,255,0)']}
        >

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
                    onPress={this.toggleCamera}
                    style={{
                      transform: [
                        { translateY: profileImagePositionY },
                        { translateX: profileImagePositionX },
                        { scale: profileImageScale },
                        { perspective: 1000 },
                      ],
                    }}
                  >
                    <CameraIcon name="camera" />
                  </AnimatedHomeHeaderProfileImage>
                  <AnimatedHomeHeaderUsername
                    onLayout={(event) => {
                      const { width } = event.nativeEvent.layout;
                      this.setState({
                        usernameWidth: width,
                      });
                    }}
                    style={{
                      transform: [
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
        </LinearGradient>
        <Animated.ScrollView
          stickyHeaderIndices={stickyHeaderIndices}
          style={{
            marginTop: -100,
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
          <RecentConnectionsWrapper>
            <RecentConnections>
              <RecentConnectionsSubtitle subtitle title="recent connections." />
              {!this.props.contacts.length && this.renderEmptyRCState()}
              {!!this.props.contacts.length &&
                <RecentConnectionsScrollView horizontal nestedScrollEnabled overScrollMode="always">
                  {this.renderRecentConnections()}
                </RecentConnectionsScrollView>}
            </RecentConnections>
          </RecentConnectionsWrapper>
          <Tabs title="your activity." tabs={activityFeedTabs} />
          <ActivityFeed
            onCancelInvitation={cancelInvitation}
            onRejectInvitation={rejectInvitation}
            onAcceptInvitation={acceptInvitation}
            navigation={navigation}
            activeTab={this.state.activeTab}
            esData={esData}
            sortable
          />
        </Animated.ScrollView>
        <Camera
          isVisible={showCamera}
          modalHide={this.toggleCamera}
          permissionsGranted={permissionsGranted}
        />
      </Container>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
  user: { data: user },
  history: { data: history, historyNotifications },
  invitations: { data: invitations },
  wallet: { data: wallet },
  chat: { data: chats },
  notifications: { intercomNotificationsCount },
}) => ({
  contacts,
  user,
  historyNotifications,
  history,
  invitations,
  wallet,
  chats,
  intercomNotificationsCount,
});

const mapDispatchToProps = (dispatch) => ({
  cancelInvitation: (invitation) => dispatch(cancelInvitationAction(invitation)),
  acceptInvitation: (invitation) => dispatch(acceptInvitationAction(invitation)),
  rejectInvitation: (invitation) => dispatch(rejectInvitationAction(invitation)),
  fetchTransactionsHistoryNotifications: () => dispatch(fetchTransactionsHistoryNotificationsAction()),
  fetchInviteNotifications: () => dispatch(fetchInviteNotificationsAction()),
  setUnreadNotificationsStatus: (status) => dispatch(setUnreadNotificationsStatusAction(status)),
  getExistingChats: () => dispatch(getExistingChatsAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(HomeScreen);
