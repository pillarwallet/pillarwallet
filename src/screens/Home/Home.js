// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { RefreshControl } from 'react-native';
import { PROFILE, CONTACT } from 'constants/navigationConstants';
import ActivityFeed from 'components/ActivityFeed';
import styled from 'styled-components/native';
import { Container, ScrollWrapper } from 'components/Layout';
import Intercom from 'react-native-intercom';
import { SubHeading, BaseText, BoldText } from 'components/Typography';
import PortfolioBalance from 'components/PortfolioBalance';
import { uniqBy } from 'utils/common';
import { getUserName } from 'utils/contacts';
import {
  fetchTransactionsHistoryNotificationsAction,
  fetchTransactionsHistoryAction,
} from 'actions/historyActions';
import ButtonIcon from 'components/ButtonIcon';
import ProfileImage from 'components/ProfileImage';
import EmptyStateParagraph from 'components/EmptyState/EmptyStateParagraph';
import { UIColors, baseColors, fontSizes } from 'utils/variables';
import {
  cancelInvitationAction,
  acceptInvitationAction,
  rejectInvitationAction,
  fetchInviteNotificationsAction,
} from 'actions/invitationsActions';
import { TYPE_ACCEPTED } from 'constants/invitationsConstants';
import { TRANSACTION_EVENT } from 'constants/historyConstants';

const HomeHeader = styled.View`
  height: 120px;
  padding: 0 16px;
  align-content: space-between;
  border-bottom-width: 1px;
  border-style: solid;
  border-color: ${UIColors.defaultBorderColor};
`;

const HomeHeaderRow = styled.View`
  flex: 1;
  align-items: center;
  justify-content: flex-start;
  flex-direction: row;
`;

const HomeHeaderUsername = styled(BoldText)`
  font-size: ${fontSizes.extraLarge};
`;

const HomeHeaderButtons = styled.View`
  margin-left: auto;
  flex-direction: row;
  align-items: flex-end;
`;

const HomeHeaderButton = styled(ButtonIcon)`
  margin-left: 10px;
`;

const RecentConnections = styled.View`
  min-height: 140px;
  background-color: ${baseColors.lightGray};
  border-bottom-width: 1px;
  border-style: solid;
  border-color: ${UIColors.defaultBorderColor};
`;

const RecentConnectionsScrollView = styled.ScrollView`

`;

const RecentConnectionsSubHeading = styled(SubHeading)`
  margin: 16px;
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

class PeopleScreen extends React.Component<Props> {
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
    } = this.props;
    const mappedContacts = contacts.map(({ ...rest }) => ({ ...rest, type: TYPE_ACCEPTED }));
    const mappedHistory = this.mapTransactionsHistory(history, historyNotifications, mappedContacts);
    const homeNotifications = [...mappedContacts, ...invitations, ...mappedHistory]
      .sort((a, b) => b.createdAt - a.createdAt);
    return (
      <Container>
        <HomeHeader>
          <HomeHeaderRow>
            <ProfileImage
              uri={user.avatar}
              userName={user.username}
              diameter={42}
              containerStyle={{
                marginRight: 10,
              }}
            />
            <HomeHeaderUsername>{user.username}</HomeHeaderUsername>
            <HomeHeaderButtons>
              <HomeHeaderButton
                icon="help"
                color={baseColors.darkGray}
                fontSize={24}
                onPress={() => Intercom.displayMessenger()}
              />
              <HomeHeaderButton
                icon="settings"
                color={baseColors.darkGray}
                fontSize={24}
                onPress={() => this.goToProfile()}
              />
            </HomeHeaderButtons>
          </HomeHeaderRow>
          <HomeHeaderRow>
            <PortfolioBalance />
          </HomeHeaderRow>
        </HomeHeader>
        <ScrollWrapper
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
          <RecentConnections>
            <RecentConnectionsSubHeading>RECENT CONNECTIONS</RecentConnectionsSubHeading>
            {!this.props.contacts.length && this.renderEmptyRCState()}
            {!!this.props.contacts.length &&
            <RecentConnectionsScrollView horizontal nestedScrollEnabled overScrollMode="always">
              {this.renderRecentConnections()}
            </RecentConnectionsScrollView>}
          </RecentConnections>
          <ActivityFeed
            onCancelInvitation={cancelInvitation}
            onRejectInvitation={rejectInvitation}
            onAcceptInvitation={acceptInvitation}
            history={homeNotifications}
            walletAddress={walletAddress}
            navigation={navigation}
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

export default connect(mapStateToProps, mapDispatchToProps)(PeopleScreen);
