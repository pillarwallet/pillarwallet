// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp, NavigationEventSubscription } from 'react-navigation';
import { RefreshControl, Platform } from 'react-native';
import { PROFILE, CONTACT } from 'constants/navigationConstants';
import ActivityFeed from 'components/ActivityFeed';
import styled from 'styled-components/native';
import { Container, ScrollWrapper } from 'components/Layout';
import Intercom from 'react-native-intercom';
import { BaseText } from 'components/Typography';
import Title from 'components/Title';
import PortfolioBalance from 'components/PortfolioBalance';
import { uniqBy, isIphoneX } from 'utils/common';
import { getUserName } from 'utils/contacts';
import {
  fetchTransactionsHistoryNotificationsAction,
  fetchTransactionsHistoryAction,
} from 'actions/historyActions';
import { setUnreadNotificationsStatusAction } from 'actions/notificationsActions';
import IconButton from 'components/IconButton';
import Icon from 'components/Icon';
import ProfileImage from 'components/ProfileImage';
import Camera from 'components/Camera';
import Permissions from 'react-native-permissions';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import { UIColors, baseColors, fontSizes, spacing } from 'utils/variables';
import {
  cancelInvitationAction,
  acceptInvitationAction,
  rejectInvitationAction,
  fetchInviteNotificationsAction,
} from 'actions/invitationsActions';
import { getExistingChatsAction } from 'actions/chatActions';
import { TYPE_ACCEPTED } from 'constants/invitationsConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';

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
  fetchTransactionsHistory: Function,
  acceptInvitation: Function,
  cancelInvitation: Function,
  rejectInvitation: Function,
  setUnreadNotificationsStatus: Function,
  homeNotifications: Object[],
  getExistingChats: Function,
  chats: any,
};

type State = {
  activeTab: string,
  esTitle: string,
  esBody: string,
  showCamera: boolean,
  permissionsGranted: boolean,
};

const TRANSACTIONS = 'TRANSACTIONS';
const SOCIAL = 'SOCIAL';
const ALL = 'ALL';


const HomeHeader = styled.View`
  padding: 0 ${spacing.rhythm}px;
  margin-top: ${isIphoneX() ? '0' : '20px'};
`;

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
`;

const HomeHeaderButton = styled(IconButton)`
  align-items: ${props => props.flexEnd ? 'flex-end' : 'flex-start'};
  width: 44px;
  height: 44px;
`;

const HomeHeaderProfileImage = styled(ProfileImage)`
  margin-bottom: 20px;
`;

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

const TabWrapper = styled.View`
  padding: 10px 16px 10px;
  background: ${baseColors.white};
  border-bottom-width: 1px;
  border-color: ${UIColors.defaultBorderColor};
  border-style: solid;
`;

const TabWrapperScrollView = styled.ScrollView`
  flex-direction: row;
`;

const TabItem = styled.TouchableOpacity`
  height: 32px;
  padding: 0 10px;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.active ? baseColors.electricBlue : 'transparent'};
  border-radius: 16px;
  flex-direction: row;
`;

const TabItemIcon = styled(Icon)`
  font-size: ${fontSizes.extraSmall};
  margin-right: 5px;
  color: ${props => props.active ? baseColors.white : baseColors.darkGray};
`;

const CameraIcon = styled(Icon)`
  font-size: ${fontSizes.extraLarge};
  color: ${baseColors.electricBlue};
`;

const TabItemText = styled(BaseText)`
  font-size: ${fontSizes.extraSmall};
  color: ${props => props.active ? baseColors.white : baseColors.darkGray};
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

const ActivityFeedHeader = styled.View`
  padding: 0 ${spacing.rhythm}px;
`;

class HomeScreen extends React.Component<Props, State> {
  _willFocus: NavigationEventSubscription;

  state = {
    activeTab: 'ALL',
    esTitle: 'Make your first step',
    esBody: 'Your activity will appear here.',
    showCamera: false,
    permissionsGranted: false,
  };

  componentDidMount() {
    const { fetchInviteNotifications } = this.props;
    fetchInviteNotifications();

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
      .slice(0, 5)
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

  mapTransactionsHistory(history, historyNotifications, contacts) {
    const concatedHistory = history
      .map(({
        hash,
        ...rest
      }) => ({
        txHash: hash,
        type: TRANSACTION_EVENT,
        ...rest,
      }))
      .concat(historyNotifications.map(({ toAddress, fromAddress, ...rest }) => ({
        to: toAddress,
        from: fromAddress,
        ...rest,
      })))
      .map(({ to, from, ...rest }) => {
        const contact = contacts.find(({ ethAddress }) => {
          return from.toUpperCase() === ethAddress.toUpperCase()
            || to.toUpperCase() === ethAddress.toUpperCase();
        });
        return {
          username: getUserName(contact),
          to,
          from,
          ...rest,
        };
      });
    return uniqBy(concatedHistory, 'txHash');
  }

  refreshScreenData = () => {
    const {
      fetchTransactionsHistoryNotifications,
      fetchInviteNotifications,
      fetchTransactionsHistory,
      getExistingChats,
      wallet,
    } = this.props;
    fetchTransactionsHistoryNotifications();
    fetchInviteNotifications();
    fetchTransactionsHistory(wallet.address);
    getExistingChats();
  };

  render() {
    const {
      user,
      cancelInvitation,
      acceptInvitation,
      rejectInvitation,
      contacts,
      invitations,
      historyNotifications,
      history,
      wallet: { address: walletAddress },
      navigation,
      chats,
    } = this.props;
    const {
      activeTab,
      esBody,
      esTitle,
      showCamera,
      permissionsGranted,
    } = this.state;
    const mappedContacts = contacts.map(({ ...rest }) => ({ ...rest, type: TYPE_ACCEPTED }));
    const mappedHistory = this.mapTransactionsHistory(history, historyNotifications, mappedContacts);
    const chatNotifications = chats.chats
      .map((
        {
          username,
          lastMessage,
        }) => {
        if (lastMessage.savedTimestamp === '') return {};
        return {
          content: lastMessage.content,
          username,
          type: 'CHAT',
          createdAt: lastMessage.savedTimestamp,
        };
      });

    const homeNotifications = [...mappedContacts, ...invitations, ...mappedHistory, ...chatNotifications]
      .filter(value => Object.keys(value).length !== 0)
      .sort((a, b) => b.createdAt - a.createdAt);
    const stickyHeaderIndices = Platform.OS === 'android' ? null : [3];

    return (
      <Container>
        <ScrollWrapper
          stickyHeaderIndices={stickyHeaderIndices}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={this.refreshScreenData}
            />
          }
        >
          <HomeHeader>
            <HomeHeaderRow>
              <HomeHeaderLeft>
                <HomeHeaderButton
                  icon="help"
                  color={baseColors.darkGray}
                  fontSize={24}
                  onPress={() => Intercom.displayMessenger()}
                />
              </HomeHeaderLeft>

              <HomeHeaderBody>
                <HomeHeaderProfileImage
                  uri={`${user.profileImage}?${+new Date()}`}
                  userName={user.username}
                  diameter={72}
                  onPress={this.toggleCamera}
                >
                  <CameraIcon name="camera" />
                </HomeHeaderProfileImage>
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
                <HomeHeaderUsername>{user.username}</HomeHeaderUsername>
                <HomeHeaderPortfolioBalance />
              </HomeHeaderBody>
            </HomeHeaderRow>
          </HomeHeader>

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
          <ActivityFeedHeader>
            <Title subtitle title="your activity." />
          </ActivityFeedHeader>
          <TabWrapper>
            <TabWrapperScrollView horizontal>
              <TabItem
                active={activeTab === ALL}
                onPress={() => this.setState({
                  activeTab: ALL,
                  esTitle: 'Make your first step',
                  esBody: 'Your activity will appear here.',
                })}
              >
                <TabItemIcon active={activeTab === ALL} name="all" />
                <TabItemText active={activeTab === ALL}>All</TabItemText>
              </TabItem>
              <TabItem
                active={activeTab === TRANSACTIONS}
                onPress={() => this.setState({
                  activeTab: TRANSACTIONS,
                  esTitle: 'Make your first step',
                  esBody: 'Your transactions will appear here. Send or receive tokens to start.',
                })}
              >
                <TabItemIcon active={activeTab === TRANSACTIONS} name="send" />
                <TabItemText active={activeTab === TRANSACTIONS}>Transactions</TabItemText>
              </TabItem>
              <TabItem
                active={activeTab === SOCIAL}
                onPress={() => this.setState({
                  activeTab: SOCIAL,
                  esTitle: 'Make your first step',
                  esBody: 'Information on your connections will appear here. Send a connection request to start.',
                })}
              >
                <TabItemIcon active={activeTab === SOCIAL} name="social" />
                <TabItemText active={activeTab === SOCIAL}>Social</TabItemText>
              </TabItem>
            </TabWrapperScrollView>
          </TabWrapper>
          <ActivityFeed
            onCancelInvitation={cancelInvitation}
            onRejectInvitation={rejectInvitation}
            onAcceptInvitation={acceptInvitation}
            history={homeNotifications}
            walletAddress={walletAddress}
            navigation={navigation}
            activeTab={activeTab}
            esBody={esBody}
            esTitle={esTitle}
          />
        </ScrollWrapper>
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
}) => ({
  contacts,
  user,
  historyNotifications,
  history,
  invitations,
  wallet,
  chats,
});

const mapDispatchToProps = (dispatch) => ({
  cancelInvitation: (invitation) => dispatch(cancelInvitationAction(invitation)),
  acceptInvitation: (invitation) => dispatch(acceptInvitationAction(invitation)),
  rejectInvitation: (invitation) => dispatch(rejectInvitationAction(invitation)),
  fetchTransactionsHistoryNotifications: () => dispatch(fetchTransactionsHistoryNotificationsAction()),
  fetchTransactionsHistory: (walletAddress) => dispatch(fetchTransactionsHistoryAction(walletAddress)),
  fetchInviteNotifications: () => dispatch(fetchInviteNotificationsAction()),
  setUnreadNotificationsStatus: (status) => dispatch(setUnreadNotificationsStatusAction(status)),
  getExistingChats: () => dispatch(getExistingChatsAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(HomeScreen);
