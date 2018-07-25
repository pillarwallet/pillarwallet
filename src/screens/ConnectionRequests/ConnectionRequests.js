// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { TYPE_RECEIVED } from 'constants/invitationsConstants';
import {
  cancelInvitationAction,
  acceptInvitationAction,
  rejectInvitationAction,
} from 'actions/invitationsActions';
import { Container, ScrollWrapper } from 'components/Layout';
import Header from 'components/Header';
import ContactCard from 'components/ContactCard';

type Props = {
  navigation: NavigationScreenProp<*>,
  invitations: Object[],
  cancelInvitation: Function,
  rejectInvitation: Function,
  acceptInvitation: Function,
}

const ContactCardList = styled(ScrollWrapper)`
  padding: 16px;
`;

class ConnectionRequests extends React.Component<Props> {
  handleAcceptInvitationPress = (invitation) => () => {
    const { acceptInvitation } = this.props;
    acceptInvitation(invitation);
  };

  handleRejectInvitatonPress = (invitation) => () => {
    const { rejectInvitation } = this.props;
    rejectInvitation(invitation);
  };

  handleCancelInvitationPress = (invitation) => () => {
    const { cancelInvitation } = this.props;
    cancelInvitation(invitation);
  };

  renderInvitations = () => {
    const { invitations } = this.props;
    return invitations
      .filter(({ type }) => type === TYPE_RECEIVED)
      .map(invitation => (
        <ContactCard
          key={invitation.id}
          onAcceptInvitationPress={this.handleAcceptInvitationPress(invitation)}
          onRejectInvitationPress={this.handleRejectInvitatonPress(invitation)}
          onCancelInvitationPress={this.handleCancelInvitationPress(invitation)}
          name={invitation.username}
          status={invitation.type}
          showActions
        />
      ));
  };

  render() {
    return (
      <Container>
        <Header
          title="connection requests"
          onBack={this.props.navigation.goBack}
        />
        <ContactCardList contentInset={{ bottom: 40 }}>
          {this.renderInvitations()}
        </ContactCardList>
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
});

export default connect(mapStateTopProps, mapDispatchToProps)(ConnectionRequests);
