// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { Keyboard } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { TYPE_INVITE, TYPE_ACCEPTED } from 'constants/invitationsConstants';
import { baseColors, fontSizes } from 'utils/variables';
import { Wrapper } from 'components/Layout';
import ContactCard from 'components/ContactCard';
import ContactsSeparator from 'components/ContactsSeparator';
import type { SearchResults, ApiUser } from 'models/Contacts';
import {
  sendInvitationAction,
  acceptInvitationAction,
  cancelInvitationAction,
  rejectInvitationAction,
} from 'actions/invitationsActions';

const ContactCardList = styled.FlatList`
  padding: 16px;
`;

const TabWrapper = styled.View`
  flex-direction: row;
`;

const TabItem = styled.TouchableOpacity`
  height: 44px;
  align-items: center;
  justify-content: center;
  flex: 1;
  border-color: ${props => props.active ? baseColors.electricBlue : baseColors.lightGray};
  border-bottom-width: 2px;
`;

const TabItemText = styled.Text`
  font-size: ${fontSizes.medium};
  color: ${props => props.active ? baseColors.slateBlack : baseColors.darkGray};
`;

const tabs = {
  contacts: 'CONTACTS',
  allUsers: 'ALL_USERS',
};

type Props = {
  navigation: NavigationScreenProp<*>,
  searchResults: SearchResults,
  sendInvitation: Function,
  acceptInvitation: Function,
  cancelInvitation: Function,
  rejectInvitation: Function,
  invitations: Object[],
  localContacts: Object[],
};

type State = {
  activeTab: string,
};

class PeopleSearchResults extends React.Component<Props, State> {
  state = {
    activeTab: tabs.allUsers,
  };

  handleSendInvitationPress = (user: ApiUser) => () => {
    this.props.sendInvitation(user);
  };

  handleAcceptInvitationPress = (user: ApiUser) => () => {
    const { acceptInvitation, invitations } = this.props;
    const invitation = invitations.find(({ id }) => id === user.id);
    acceptInvitation(invitation);
  };

  handleCancelInvitationPress = (user: ApiUser) => () => {
    const { cancelInvitation, invitations } = this.props;
    const invitation = invitations.find(({ id }) => id === user.id);
    cancelInvitation(invitation);
  };

  handleRejectInvitationPress = (user: ApiUser) => () => {
    const { rejectInvitation, invitations } = this.props;
    const invitation = invitations.find(({ id }) => id === user.id);
    rejectInvitation(invitation);
  };

  renderContact = ({ item: user }) => {
    const { invitations, localContacts } = this.props;
    const localContactsIds = localContacts.map(({ id }) => id);
    const invitation = invitations.find(({ id }) => id === user.id);
    let status = TYPE_INVITE;
    if (invitation) {
      status = invitation.type;
    }
    if (localContactsIds.includes(user.id)) {
      status = TYPE_ACCEPTED;
    }
    return (
      <ContactCard
        onSendInvitationPress={this.handleSendInvitationPress(user)}
        onAcceptInvitationPress={this.handleAcceptInvitationPress(user)}
        onCancelInvitationPress={this.handleCancelInvitationPress(user)}
        onRejectInvitationPress={this.handleRejectInvitationPress(user)}
        name={user.username}
        key={user.id}
        status={status}
        showActions
        noBorder
      />
    );
  };

  render() {
    const { activeTab } = this.state;
    const { searchResults } = this.props;
    const users = {
      [tabs.allUsers]: searchResults.apiUsers,
      [tabs.contacts]: searchResults.localContacts,
    };
    return (
      <React.Fragment>
        <Wrapper regularPadding>
          <TabWrapper>
            <TabItem
              active={activeTab === tabs.allUsers}
              onPress={() => this.setState({ activeTab: tabs.allUsers })}
            >
              <TabItemText active={activeTab === tabs.allUsers}>All users</TabItemText>
            </TabItem>
            <TabItem
              active={activeTab === tabs.contacts}
              onPress={() => this.setState({ activeTab: tabs.contacts })}
            >
              <TabItemText>My contacts</TabItemText>
            </TabItem>
          </TabWrapper>
        </Wrapper>
        <ContactCardList
          data={users[activeTab]}
          renderItem={this.renderContact}
          onScroll={() => Keyboard.dismiss()}
          keyExtractor={({ username }) => username}
          contentContainerStyle={{ paddingBottom: 40 }}
          ItemSeparatorComponent={ContactsSeparator}
        />
      </React.Fragment>
    );
  }
}

const mapDispatchToProps = (dispatch: Function) => ({
  sendInvitation: (user) => dispatch(sendInvitationAction(user)),
  acceptInvitation: (user) => dispatch(acceptInvitationAction(user)),
  cancelInvitation: (user) => dispatch(cancelInvitationAction(user)),
  rejectInvitation: (user) => dispatch(rejectInvitationAction(user)),
});

export default connect(null, mapDispatchToProps)(PeopleSearchResults);
