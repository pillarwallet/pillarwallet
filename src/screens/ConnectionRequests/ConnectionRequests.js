// @flow
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
import { PEOPLE } from 'constants/navigationConstants';
import { Container } from 'components/Layout';
import Header from 'components/Header';
import ContactCard from 'components/ContactCard';
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
  componentDidUpdate() {
    const { navigation, invitations } = this.props;
    const requests = invitations.filter(({ type }) => type === TYPE_RECEIVED);
    if (!requests.length) navigation.navigate(PEOPLE);
  }

  handleAcceptInvitationPress = (invitation) => () => {
    const { acceptInvitation } = this.props;
    acceptInvitation(invitation);
  };

  handleRejectInvitatonPress = (invitation) => () => {
    const { rejectInvitation } = this.props;
    createAlert(TYPE_REJECTED, invitation, () => rejectInvitation(invitation));
  };

  handleCancelInvitationPress = (invitation) => () => {
    const { cancelInvitation } = this.props;
    cancelInvitation(invitation);
  };

  renderInvitation = ({ item }) => (
    <ContactCard
      noBorder
      disabled
      key={item.id}
      onAcceptInvitationPress={this.handleAcceptInvitationPress(item)}
      onRejectInvitationPress={this.handleRejectInvitatonPress(item)}
      onCancelInvitationPress={this.handleCancelInvitationPress(item)}
      name={item.username}
      status={item.type}
      showActions
      avatar={item.profileImage}
    />
  );

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
