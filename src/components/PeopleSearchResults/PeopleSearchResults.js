// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { Keyboard } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { TYPE_INVITE, TYPE_ACCEPTED } from 'constants/invitationsConstants';
import { CONTACT } from 'constants/navigationConstants';
import { baseColors, fontSizes, UIColors } from 'utils/variables';
import ContactCard from 'components/ContactCard';
import ContactsSeparator from 'components/ContactsSeparator';
import { SubHeading } from 'components/Typography';
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

const LocalContacts = styled.View`
  height: 140px;
  background-color: ${baseColors.lightGray};
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-style: solid;
  border-color: ${UIColors.defaultBorderColor};
`;

const LocalContactsScrollView = styled.ScrollView`
`;

const LocalContactsSubHeading = styled(SubHeading)`
  margin: 16px;
`;

const LocalContactsItem = styled.TouchableOpacity`
  align-items: center;
  width: 64px;
  margin: 0 8px;
`;

const LocalContactsItemAvatarWrapper = styled.View`
  width: 52px;
  height: 52px;
  border-radius: 26px;
  background-color: ${baseColors.cyan};
  border: 2px solid white;
  shadow-color: ${baseColors.black};
  shadow-offset: 0 0;
  shadow-radius: 2px     ;
  shadow-opacity: 0.1;
  margin-bottom: 10px;
`;

const LocalContactsItemAvatarImage = styled.Image`
`;

const LocalContactsItemName = styled.Text`
  font-size: ${fontSizes.small};
  color: ${baseColors.darkGray};
`;

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

class PeopleSearchResults extends React.Component<Props> {
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

  renderLocalContacts = (contacts = []) => {
    const { navigation } = this.props;
    return contacts
      .map(contact => (
        <LocalContactsItem
          key={contact.username}
          onPress={() => navigation.navigate(CONTACT, { contact })}
        >
          <LocalContactsItemAvatarWrapper>
            <LocalContactsItemAvatarImage />
          </LocalContactsItemAvatarWrapper>
          <LocalContactsItemName numberOfLines={1}>{contact.username}</LocalContactsItemName>
        </LocalContactsItem>
      ));
  };

  render() {
    const { searchResults } = this.props;
    return (
      <React.Fragment>
        {!!searchResults.localContacts.length && (
          <LocalContacts>
            <LocalContactsSubHeading>MY CONTACTS</LocalContactsSubHeading>
            <LocalContactsScrollView horizontal>
              {this.renderLocalContacts(searchResults.localContacts)}
            </LocalContactsScrollView>
          </LocalContacts>
        )}
        {!!searchResults.apiUsers.length && (
          <ContactCardList
            data={searchResults.apiUsers}
            renderItem={this.renderContact}
            onScroll={() => Keyboard.dismiss()}
            keyExtractor={({ username }) => username}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListHeaderComponent={<SubHeading>ALL USERS</SubHeading>}
            ItemSeparatorComponent={ContactsSeparator}
          />
        )}
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
