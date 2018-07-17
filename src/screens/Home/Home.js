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
import { SubHeading } from 'components/Typography';
import PortfolioBalance from 'components/PortfolioBalance';
import { fetchTransactionsHistoryNotificationsAction } from 'actions/historyActions';
import ButtonIcon from 'components/ButtonIcon';
import ProfileImage from 'components/ProfileImage';
import { UIColors, baseColors, fontSizes, fontWeights } from 'utils/variables';
import {
  cancelInvitationAction,
  acceptInvitationAction,
  rejectInvitationAction,
  fetchInviteNotificationsAction,
} from 'actions/invitationsActions';
import { TYPE_ACCEPTED } from 'constants/invitationsConstants';

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

const HomeHeaderAvatar = styled.View`
  width: 40px;
  height: 40px;
  border-radius: 20px;
  margin-right: 10px;
  background-color: ${baseColors.darkGray};
`;

const HomeHeaderUsername = styled.BaseText`
  font-size: ${fontSizes.extraLarge};
  font-weight: ${fontWeights.bold};
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
  height: 140px;
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

const RecentConnectionsItemName = styled.BaseText`
  font-size: ${fontSizes.extraSmall};
  color: ${baseColors.darkGray};
`;

type Props = {
  navigation: NavigationScreenProp<*>,
  contacts: Object[],
  invitations: Object[],
  historyNotifications: Object[],
  user: Object,
  fetchHistoryNotifications: Function,
  fetchInviteNotifications: Function,
  acceptInvitation: Function,
  cancelInvitation: Function,
  rejectInvitation: Function,
  homeNotifications: Object[],
};

class PeopleScreen extends React.Component<Props> {
  componentDidMount() {
    const { fetchHistoryNotifications, fetchInviteNotifications } = this.props;
    fetchHistoryNotifications();
    fetchInviteNotifications();
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

  render() {
    const {
      user,
      cancelInvitation,
      acceptInvitation,
      rejectInvitation,
      contacts,
      invitations,
      historyNotifications,
    } = this.props;
    const mappedContacts = contacts.map(({ ...rest }) => ({ ...rest, type: TYPE_ACCEPTED }));
    const homeNotifications = [...mappedContacts, ...invitations, ...historyNotifications]
      .sort((a, b) => b.createdAt - a.createdAt);
    return (
      <Container>
        <HomeHeader>
          <HomeHeaderRow>
            <ProfileImage
              uri={user.avatar}
              userName={user.username}
              diameter={40}
              containerStyle={{
                marginRight: 10,
              }}
            />
            <HomeHeaderUsername>{user.username}</HomeHeaderUsername>
            <HomeHeaderButtons>
              <HomeHeaderButton
                icon="question-circle-o"
                type="FontAwesome"
                color={baseColors.darkGray}
                fontSize={24}
                onPress={() => Intercom.displayMessenger()}
              />
              <HomeHeaderButton
                icon="cog"
                type="FontAwesome"
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
                const { fetchHistoryNotifications, fetchInviteNotifications } = this.props;
                fetchHistoryNotifications();
                fetchInviteNotifications();
              }}
            />
          }
        >
          <RecentConnections>
            <RecentConnectionsSubHeading>RECENT CONNECTIONS</RecentConnectionsSubHeading>
            <RecentConnectionsScrollView horizontal>
              {this.renderRecentConnections()}
            </RecentConnectionsScrollView>
          </RecentConnections>
          <ActivityFeed
            onCancelInvitation={cancelInvitation}
            onRejectInvitation={rejectInvitation}
            onAcceptInvitation={acceptInvitation}
            history={homeNotifications}
          />
        </ScrollWrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({
  contacts: { data: contacts },
  user: { data: user },
  history: { historyNotifications },
  invitations: { data: invitations },
}) => ({
  contacts,
  user,
  historyNotifications,
  invitations,
});

const mapDispatchToProps = (dispatch) => ({
  cancelInvitation: (invitation) => dispatch(cancelInvitationAction(invitation)),
  acceptInvitation: (invitation) => dispatch(acceptInvitationAction(invitation)),
  rejectInvitation: (invitation) => dispatch(rejectInvitationAction(invitation)),
  fetchHistoryNotifications: () => dispatch(fetchTransactionsHistoryNotificationsAction()),
  fetchInviteNotifications: () => dispatch(fetchInviteNotificationsAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(PeopleScreen);
