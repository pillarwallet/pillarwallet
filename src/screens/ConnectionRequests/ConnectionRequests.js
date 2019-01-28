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
import { FlatList, RefreshControl } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { TYPE_RECEIVED, TYPE_REJECTED } from 'constants/invitationsConstants';
import { spacing } from 'utils/variables';
import {
  cancelInvitationAction,
  acceptInvitationAction,
  rejectInvitationAction,
  fetchInviteNotificationsAction,
} from 'actions/invitationsActions';
import { PEOPLE, CONTACT } from 'constants/navigationConstants';
import { Container } from 'components/Layout';
import Header from 'components/Header';
import ListItemWithImage from 'components/ListItem/ListItemWithImage';
import Separator from 'components/Separator';
import { createAlert } from 'utils/alerts';

type Props = {
  navigation: NavigationScreenProp<*>,
  invitations: Object[],
  cancelInvitation: Function,
  rejectInvitation: Function,
  acceptInvitation: Function,
  fetchInviteNotifications: Function,
}

class ConnectionRequests extends React.Component<Props> {
  redirectStarted = false;

  componentDidUpdate() {
    const { navigation, invitations } = this.props;
    const requests = invitations.filter(({ type }) => type === TYPE_RECEIVED);
    if (!requests.length && !this.redirectStarted) {
      this.redirectStarted = true; // HACK: redirect only once
      navigation.navigate(PEOPLE);
    }
  }

  handleAcceptInvitationPress = (invitation) => () => {
    const { acceptInvitation } = this.props;
    acceptInvitation(invitation);
  };

  handleRejectInvitatonPress = (invitation) => () => {
    const { rejectInvitation } = this.props;
    createAlert(TYPE_REJECTED, invitation, () => rejectInvitation(invitation));
  };

  renderInvitation = ({ item }) => {
    const { navigation } = this.props;
    return (
      <ListItemWithImage
        label={item.username}
        avatarUrl={item.profileImage}
        navigateToProfile={() => { navigation.navigate(CONTACT, { contact: item }); }}
        rejectInvitation={this.handleRejectInvitatonPress(item)}
        acceptInvitation={this.handleAcceptInvitationPress(item)}
      />
    );
  };

  render() {
    const {
      invitations,
      fetchInviteNotifications,
    } = this.props;

    return (
      <Container>
        <Header
          title="connection requests"
          onBack={() => this.props.navigation.goBack(null)}
        />

        <FlatList
          data={invitations.filter(({ type }) => type === TYPE_RECEIVED)}
          extraData={invitations}
          keyExtractor={(item) => item.id}
          renderItem={this.renderInvitation}
          ItemSeparatorComponent={() => <Separator spaceOnLeft={82} />}
          contentContainerStyle={{
            paddingVertical: spacing.rhythm,
            paddingTop: 0,
          }}
          refreshControl={
            <RefreshControl
              refreshing={false}
              onRefresh={() => { fetchInviteNotifications(); }}
            />
          }
        />
      </Container>
    );
  }
}

const mapStateTopProps = ({
  invitations: { data: invitations },
}) => ({
  invitations,
});

const mapDispatchToProps = (dispatch) => ({
  cancelInvitation: (invitation) => dispatch(cancelInvitationAction(invitation)),
  acceptInvitation: (invitation) => dispatch(acceptInvitationAction(invitation)),
  rejectInvitation: (invitation) => dispatch(rejectInvitationAction(invitation)),
  fetchInviteNotifications: () => dispatch(fetchInviteNotificationsAction()),
});

export default connect(mapStateTopProps, mapDispatchToProps)(ConnectionRequests);
