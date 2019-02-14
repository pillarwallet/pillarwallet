// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import { connect } from 'react-redux';
import { Keyboard, Platform } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import unionBy from 'lodash.unionby';
import intersectionBy from 'lodash.intersectionby';
import { TYPE_INVITE, TYPE_REJECTED, TYPE_SENT } from 'constants/invitationsConstants';
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
  width: ${Platform.select({
    ios: '60px',
    android: '74px',
  })};
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
  padding: 0 4px;
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
    const { invitations, navigation } = this.props;
    const invitation = invitations.find(({ id }) => id === user.id);
    let status = TYPE_INVITE;
    if (invitation) {
      status = invitation.type;
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
        buttonActionLabel={status === TYPE_SENT ? 'Requested' : 'Connect'}
        secondaryButton={status === TYPE_SENT}
      />
    );
  };

  renderLocalContactsList = () => {
    const {
      searchResults: { apiUsers, localContacts: resultsLocalContacts },
      localContacts,
    } = this.props;

    const updatedLocalContact = intersectionBy(localContacts, apiUsers, 'id');
    const filteredLocalContacts = unionBy(resultsLocalContacts, updatedLocalContact, 'id');

    if (filteredLocalContacts.length) {
      return (
        <LocalContacts>
          <LocalContactsSubHeading>MY CONTACTS</LocalContactsSubHeading>
          <LocalContactsScrollView
            keyboardShouldPersistTaps="always"
            horizontal
          >
            {this.renderLocalContacts(filteredLocalContacts)}
          </LocalContactsScrollView>
        </LocalContacts>
      );
    }
    return null;
  };

  renderLocalContacts = (filteredLocalContacts) => {
    const { navigation } = this.props;
    return filteredLocalContacts
      .map(contact => (
        <LocalContactsItem
          key={contact.username}
          onPress={() => navigation.navigate(CONTACT, { contact })}
        >
          <ProfileImage
            uri={contact.profileImage}
            userName={contact.username}
            diameter={itemSizes.avatarCircleMedium}
            textStyle={{ fontSize: fontSizes.medium }}
          />
          <LocalContactsItemName numberOfLines={1}>{contact.username}</LocalContactsItemName>
        </LocalContactsItem>
      ));
  };

  render() {
    const { localContacts, searchResults: { apiUsers } } = this.props;
    const localContactsIds = localContacts.map(({ id }) => id);
    const filteredApiUsers = apiUsers.filter((user) => !localContactsIds.includes(user.id));

    return (
      <React.Fragment>
        {this.renderLocalContactsList()}
        {!!filteredApiUsers.length && (
          <ContactCardList
            data={filteredApiUsers}
            renderItem={this.renderContact}
            onScroll={() => Keyboard.dismiss()}
            keyExtractor={({ username }) => username}
            keyboardShouldPersistTaps="always"
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
