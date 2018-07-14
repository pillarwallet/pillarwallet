// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import { baseColors, fontSizes } from 'utils/variables';
import { TYPE_RECEIVED, TYPE_SENT } from 'constants/invitationsConstants';
import {
  cancelInvitationAction,
  acceptInvitationAction,
  rejectInvitationAction,
} from 'actions/invitationsActions';
import { Container, Wrapper, ScrollWrapper } from 'components/Layout';
import ScreenHeader from 'components/ScreenHeader';
import ContactCard from 'components/ContactCard';

type Props = {
  navigation: NavigationScreenProp<*>,
  invitations: Object[],
  cancelInvitation: Function,
  rejectInvitation: Function,
  acceptInvitation: Function,
}

type State = {
  activeTab: string,
}


const ContactCardList = styled(ScrollWrapper)`
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

class ConnectionRequests extends React.Component<Props, State> {
  state = {
    activeTab: TYPE_RECEIVED,
  };

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
    const { activeTab } = this.state;
    return invitations
      .filter(({ type }) => type === activeTab)
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
    const { activeTab } = this.state;
    return (
      <Container>
        <ScreenHeader title="connection requests" onBack={this.props.navigation.goBack} />
        <Wrapper regularPadding>
          <TabWrapper>
            <TabItem
              active={activeTab === TYPE_RECEIVED}
              onPress={() => this.setState({ activeTab: TYPE_RECEIVED })}
            >
              <TabItemText active={activeTab === TYPE_RECEIVED}>Received</TabItemText>
            </TabItem>
            <TabItem
              active={activeTab === TYPE_SENT}
              onPress={() => this.setState({ activeTab: TYPE_SENT })}
            >
              <TabItemText active={activeTab === TYPE_SENT}>Sent</TabItemText>
            </TabItem>
          </TabWrapper>
        </Wrapper>
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
