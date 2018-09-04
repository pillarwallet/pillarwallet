// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp, NavigationEventSubscription } from 'react-navigation';
import firebase from 'react-native-firebase';
import { Animated, RefreshControl, Platform, View } from 'react-native';
import { PROFILE, CONTACT } from 'constants/navigationConstants';
import ActivityFeed from 'components/ActivityFeed';
import styled from 'styled-components/native';
import { Container, ScrollWrapper } from 'components/Layout';
import Intercom from 'react-native-intercom';
import { BaseText } from 'components/Typography';
import Title from 'components/Title';
import PortfolioBalance from 'components/PortfolioBalance';
import { fetchTransactionsHistoryNotificationsAction } from 'actions/historyActions';
import { setUnreadNotificationsStatusAction } from 'actions/notificationsActions';
import IconButton from 'components/IconButton';
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
import { ALL } from 'constants/activityConstants';

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

type State = {
  showCamera: boolean,
  permissionsGranted: boolean,
  scrollY: Animated.Value,
};

const AnimatedScrollWrapper = Animated.createAnimatedComponent(ScrollWrapper);

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

const HomeHeaderUsername = styled(BaseText)`
  font-size: ${fontSizes.mediumLarge};
  margin-bottom: 5px;
  margin-top: 40px;
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
  margin-bottom: 20px;
`;

const AnimatedHomeHeaderProfileImage = Animated.createAnimatedComponent(HomeHeaderProfileImage);

const HomeHeaderPortfolioBalance = styled(PortfolioBalance)`
  margin-bottom: 10px;
`;

const RecentConnections = styled.View`
  min-height: 160px;
  border-bottom-width: 1px;
  border-style: solid;
  border-color: ${baseColors.duckEggBlue};
`;

const RecentConnectionsWrapper = styled.View`
  shadow-color: ${baseColors.pigeonPost};
  shadow-radius: 6px;
  shadow-opacity: 0.15;
  shadow-offset: 0px 6px;
  background-color: ${baseColors.white};
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
  font-size: ${fontSizes.extraSmall};
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
    } = this.state;

    const profileImagePosition = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [0, -90],
      extrapolate: 'clamp',
    });

    const profileImageScale = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [1, 0.6],
      extrapolate: 'clamp',
    });

    const profileUsernamePosition = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [0, -36],
      extrapolate: 'clamp',
    });



    const homeHeaderHeight = scrollY.interpolate({
      inputRange: [0, 100],
      outputRange: [200, 50],
      extrapolate: 'clamp',
    });

    console.log(scrollY);

    const stickyHeaderIndices = Platform.OS === 'android' ? null : [3];
    const hasIntercomNotifications = !!intercomNotificationsCount;
    return (
      <Container>
        <AnimatedHomeHeader
        >
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

            <HomeHeaderBody>
              <AnimatedHomeHeaderProfileImage
                uri={`${user.profileImage}?t=${user.lastUpdateTime || 0}`}
                userName={user.username}
                diameter={72}
                onPress={this.toggleCamera}
                style={{
                  position: 'absolute',
                  transform: [
                    { translateX: profileImagePosition },
                    { scale: profileImageScale },
                    { perspective: 1000 },
                  ],
                }}
              >
                <CameraIcon name="camera" />
              </AnimatedHomeHeaderProfileImage>
            </HomeHeaderBody>

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
              <AnimatedHomeHeaderUsername
                style={{
                  transform: [
                    { translateY: profileUsernamePosition },
                  ],
                }}
              >
                {user.username}
              </AnimatedHomeHeaderUsername>
              <HomeHeaderPortfolioBalance />
            </HomeHeaderBody>
          </HomeHeaderRow>
        </AnimatedHomeHeader>
        <Animated.ScrollView
          stickyHeaderIndices={stickyHeaderIndices}
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
          <ActivityFeed
            feedTitle="your activity."
            onCancelInvitation={cancelInvitation}
            onRejectInvitation={rejectInvitation}
            onAcceptInvitation={acceptInvitation}
            navigation={navigation}
            activeTab={ALL}
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
