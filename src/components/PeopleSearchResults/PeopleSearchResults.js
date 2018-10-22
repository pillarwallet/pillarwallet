// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { Keyboard } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { TYPE_INVITE, TYPE_ACCEPTED, TYPE_REJECTED } from 'constants/invitationsConstants';
import { CONTACT } from 'constants/navigationConstants';
import { baseColors, fontSizes, itemSizes, spacing } from 'utils/variables';
import ContactCard from 'components/ContactCard';
import Separator from 'components/Separator';
import { SubHeading, BaseText } from 'components/Typography';
import ProfileImage from 'components/ProfileImage';
import type { SearchResults, ApiUser } from 'models/Contacts';
import { createAlert } from 'utils/alerts';
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
  background-color: ${baseColors.lighterGray};
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-style: solid;
  border-color: ${baseColors.mediumLightGray};
`;

const LocalContactsScrollView = styled.ScrollView`
`;

const LocalContactsSubHeading = styled(SubHeading)`
  margin: 16px;
`;

const LocalContactsItem = styled.TouchableOpacity`
  align-items: center;
  width: 64px;
  margin: 0 ${spacing.rhythm / 2}px;
`;

const LocalContactsItemAvatarWrapper = styled.View`
  width: 56px;
  height: 56px;
  border-radius: 28px;
  background-color: ${baseColors.cyan};
  border: 2px solid white;
  shadow-color: ${baseColors.black};
  shadow-offset: 0 0;
  shadow-radius: 2px;
  shadow-opacity: 0.1;
  margin-bottom: 8px;
  align-items: center;
  justify-content: center;
`;

const LocalContactsItemName = styled(BaseText)`
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
    Keyboard.dismiss();
    this.props.sendInvitation(user);
  };

  handleAcceptInvitationPress = (user: ApiUser) => () => {
    const { acceptInvitation, invitations } = this.props;
    const invitation = invitations.find(({ id }) => id === user.id);
    Keyboard.dismiss();
    acceptInvitation(invitation);
  };

  handleCancelInvitationPress = (user: ApiUser) => () => {
    const { cancelInvitation, invitations } = this.props;
    const invitation = invitations.find(({ id }) => id === user.id);
    Keyboard.dismiss();
    cancelInvitation(invitation);
  };

  handleRejectInvitationPress = (user: ApiUser) => () => {
    const { rejectInvitation, invitations } = this.props;
    const invitation = invitations.find(({ id }) => id === user.id);
    Keyboard.dismiss();
    if (invitation && Object.keys(invitation).length > 0) {
      createAlert(TYPE_REJECTED, invitation, () => rejectInvitation(invitation));
    }
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
        avatar={user.profileImage}
        key={user.id}
        status={status}
        showActions
        noBorder
        disabled
        noMargin
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
            <ProfileImage
              uri={contact.profileImage}
              userName={contact.username}
              diameter={itemSizes.avaratCircleMedium}
              textStyle={{ fontSize: fontSizes.medium }}
            />
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
            <LocalContactsScrollView
              keyboardShouldPersistTaps="always"
              horizontal
            >
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
            keyboardShouldPersistTaps="always"
            contentContainerStyle={{
              paddingBottom: 40,
            }}
            ListHeaderComponent={<SubHeading>ALL USERS</SubHeading>}
            ItemSeparatorComponent={() => <Separator spaceOnLeft={42} />}
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
