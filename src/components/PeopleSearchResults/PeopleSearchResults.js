// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { Keyboard, Platform } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { TYPE_INVITE, TYPE_ACCEPTED, TYPE_REJECTED, TYPE_SENT } from 'constants/invitationsConstants';
import { CONTACT } from 'constants/navigationConstants';
import { baseColors, fontSizes, itemSizes, spacing, fontWeights } from 'utils/variables';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
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
  padding: 16px 0;
`;

const LocalContacts = styled.View`
  height: 145px;
  background-color: ${baseColors.lighterGray};
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-style: solid;
  border-color: ${baseColors.mediumLightGray};
`;

const LocalContactsScrollView = styled.ScrollView`
`;

const LocalContactsSubHeading = styled(SubHeading)`
  margin: 22px 16px 13px;
  font-weight: ${fontWeights.medium};
`;

const ListSubHeading = styled(SubHeading)`
  margin: 6px ${spacing.mediumLarge}px 8px;
  font-weight: ${fontWeights.medium};
`;

const LocalContactsItem = styled.TouchableOpacity`
  align-items: center;
  width: 66px;
  margin: ${Platform.select({
    ios: `0 ${spacing.rhythm / 2}px`,
    android: `-6px ${spacing.rhythm / 2}px 0`,
  })};
  padding-top: ${Platform.select({
    ios: '3px',
    android: 0,
  })};
`;

const LocalContactsItemName = styled(BaseText)`
  font-size: ${fontSizes.extraExtraSmall};
  color: ${baseColors.darkGray};
  margin-top: ${Platform.select({
    ios: '3px',
    android: '-4px',
  })};
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
    if (invitation && Object.keys(invitation).length > 0) {
      createAlert(TYPE_REJECTED, invitation, () => rejectInvitation(invitation));
    }
  };

  renderContact = ({ item: user }) => {
    const { invitations, localContacts, navigation } = this.props;
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
      <ListItemWithImage
        label={user.username}
        avatarUrl={user.profileImage}
        navigateToProfile={() => navigation.navigate(CONTACT, { contact: user })}
        rejectInvitation={this.handleRejectInvitationPress(user)}
        acceptInvitation={this.handleAcceptInvitationPress(user)}
        buttonAction={status === TYPE_SENT
          ? this.handleCancelInvitationPress(user)
          : this.handleSendInvitationPress(user)}
        buttonActionLabel={status === TYPE_SENT ? 'Request Sent' : 'Connect'}
        secondaryButton={status === TYPE_SENT}
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
          <ProfileImage
            uri={contact.profileImage}
            userName={contact.username}
            diameter={itemSizes.avaratCircleMedium}
            textStyle={{ fontSize: fontSizes.medium }}
          />
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
            contentContainerStyle={{
              paddingBottom: 40,
            }}
            ListHeaderComponent={<ListSubHeading>ALL USERS</ListSubHeading>}
            ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
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
