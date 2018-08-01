// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { RefreshControl, Platform } from 'react-native';
import { PROFILE, CONTACT } from 'constants/navigationConstants';
import ActivityFeed from 'components/ActivityFeed';
import styled from 'styled-components/native';
import { Container, ScrollWrapper } from 'components/Layout';
import Intercom from 'react-native-intercom';
import { BaseText } from 'components/Typography';
import Title from 'components/Title';
import PortfolioBalance from 'components/PortfolioBalance';
import { uniqBy } from 'utils/common';
import { getUserName } from 'utils/contacts';
import {
  fetchTransactionsHistoryNotificationsAction,
  fetchTransactionsHistoryAction,
} from 'actions/historyActions';
import ButtonIcon from 'components/ButtonIcon';
import Icon from 'components/Icon';
import ProfileImage from 'components/ProfileImage';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import { baseColors, fontSizes, spacingSizes } from 'utils/variables';
import {
  cancelInvitationAction,
  acceptInvitationAction,
  rejectInvitationAction,
  fetchInviteNotificationsAction,
} from 'actions/invitationsActions';
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
  homeNotifications: Object[],
};

type State = {
  activeTab: string,
  esTitle: string,
  esBody: string,
}

const TRANSACTIONS = 'TRANSACTIONS';
const SOCIAL = 'SOCIAL';
const ALL = 'ALL';

const HomeHeader = styled.View`
  padding: 0 16px;
  margin-top: ${Platform.OS === 'android' ? '20px' : 0};
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

const HomeHeaderButton = styled(ButtonIcon)`
  align-self: ${props => props.flexEnd ? 'flex-end' : 'flex-start'};
`;

const HomeHeaderProfileImage = styled(ProfileImage)`
  margin-bottom: 20px;
`;

const HomeHeaderPortfolioBalance = styled(PortfolioBalance)`
  margin-bottom: 30px;
`;

const RecentConnections = styled.View`
  min-height: 160px;
  border-bottom-width: 1px;
  border-style: solid;
  border-color: ${baseColors.duckEggBlue};
`;

const RecentConnectionsWrapper = styled.View`
  shadow-color: ${baseColors.pigeonPost};
  shadow-radius: 12px;
  shadow-opacity: 0.3;
  shadow-offset: 0px 0px;
  background-color: ${baseColors.white};
`;

const RecentConnectionsScrollView = styled.ScrollView`

`;

const RecentConnectionsSubtitle = styled(Title)`
  margin-left: ${spacingSizes.defaultHorizontalSideSpacing};
`;

const RecentConnectionsItem = styled.TouchableOpacity`
  align-items: center;
  width: 64px;
  margin: 0 8px;
`;

const RecentConnectionsItemAvatarWrapper = styled.View`
  width: 52px;
  height: 52px;
  border-radius: 26px;
  background-color: ${baseColors.cyan};
  border: 2px solid white;
  shadow-color: ${baseColors.black};
  shadow-offset: 0 0;
  shadow-radius: 2px;
  shadow-opacity: 0.1;
  margin-bottom: 10px;
  elevation: 4
`;

const TabWrapper = styled.View`
  padding: 10px 16px 10px;
  background: ${baseColors.white};
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
  padding: 0 ${spacingSizes.defaultHorizontalSideSpacing}px;
`;


class HomeScreen extends React.Component<Props, State> {
  state = {
    activeTab: 'ALL',
    esTitle: 'Make your first step',
    esBody: 'Your activity will appear here.',
  }
  goToProfile = () => {
    const { navigation } = this.props;
    navigation.navigate(PROFILE);
  };

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
          <RecentConnectionsItemAvatarWrapper>
            <ProfileImage
              uri={contact.avatar}
              userName={contact.username}
              diameter={48}
            />
          </RecentConnectionsItemAvatarWrapper>
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
        from,
        to,
        timestamp,
        ...rest
      }) => ({
        txHash: hash,
        fromAddress: from,
        toAddress: to,
        type: TRANSACTION_EVENT,
        createdAt: timestamp,
        ...rest,
      }))
      .concat(historyNotifications)
      .map(({ toAddress, fromAddress, ...rest }) => {
        const contact = contacts.find(({ ethAddress }) => {
          return fromAddress.toUpperCase() === ethAddress.toUpperCase()
            || toAddress.toUpperCase() === ethAddress.toUpperCase();
        });
        return {
          username: getUserName(contact),
          toAddress,
          fromAddress,
          ...rest,
        };
      });
    return uniqBy(concatedHistory, 'txHash');
  }

  openMoreFilterOptions = () => {
    // Three dots link in filter tab bar logic should go here
  }

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
    } = this.props;
    const { activeTab, esBody, esTitle } = this.state;
    const mappedContacts = contacts.map(({ ...rest }) => ({ ...rest, type: TYPE_ACCEPTED }));
    const mappedHistory = this.mapTransactionsHistory(history, historyNotifications, mappedContacts);
    const homeNotifications = [...mappedContacts, ...invitations, ...mappedHistory]
      .sort((a, b) => b.createdAt - a.createdAt);
    const stickyHeaderIndices = Platform.OS === 'android' ? null : [3];

    return (
      <Container>
        <ScrollWrapper
          stickyHeaderIndices={stickyHeaderIndices}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => {
                const {
                  fetchTransactionsHistoryNotifications,
                  fetchInviteNotifications,
                  fetchTransactionsHistory,
                  wallet,
                } = this.props;
                fetchTransactionsHistoryNotifications();
                fetchInviteNotifications();
                fetchTransactionsHistory(wallet.address);
              }}
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
                  uri={user.avatar}
                  userName={user.username}
                  diameter={72}
                />
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
              <TabItem
                onPress={() => this.openMoreFilterOptions}
              >
                <TabItemIcon active={activeTab === SOCIAL} name="more" />
              </TabItem>
            </TabWrapperScrollView>
          </TabWrapper>
          <ActivityFeed
            onCancelInvitation={cancelInvitation}
            onRejectInvitation={rejectInvitation}
            onAcceptInvitation={acceptInvitation}
            history={homeNotifications}
            walletAddress={walletAddress}
            activeTab={activeTab}
            esBody={esBody}
            esTitle={esTitle}
          />
        </ScrollWrapper>
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
}) => ({
  contacts,
  user,
  historyNotifications,
  history,
  invitations,
  wallet,
});

const mapDispatchToProps = (dispatch) => ({
  cancelInvitation: (invitation) => dispatch(cancelInvitationAction(invitation)),
  acceptInvitation: (invitation) => dispatch(acceptInvitationAction(invitation)),
  rejectInvitation: (invitation) => dispatch(rejectInvitationAction(invitation)),
  fetchTransactionsHistoryNotifications: () => dispatch(fetchTransactionsHistoryNotificationsAction()),
  fetchTransactionsHistory: (walletAddress) => dispatch(fetchTransactionsHistoryAction(walletAddress)),
  fetchInviteNotifications: () => dispatch(fetchInviteNotificationsAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(HomeScreen);
