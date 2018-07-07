// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { CONTACT } from 'constants/navigationConstants';
import { baseColors, fontSizes } from 'utils/variables';
import { Wrapper, ScrollWrapper } from 'components/Layout';
import ContactCard from 'components/ContactCard';

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


type Props = {
  navigation: NavigationScreenProp<*>,
  searchResults: {
    apiUsers: Object[],
    localContacts: Object[],
  },
};

type State = {
  activeTab: string,
};

// NOTE: this is temporary file until new design will be ready
// NOTE: code was copy&pasted from the ConnectionRequests screen
export default class PeopleSearchResults extends React.Component<Props, State> {
  state = {
    activeTab: 'RECEIVED',
  };

  handleContactCardPress = () => {
    this.props.navigation.navigate(CONTACT);
  };

  handleAcceptInvitationPress = () => {
  };

  handleRejectInvitatonPress = () => {
  };

  handleCancelInvitationPress = () => {
  };

  render() {
    const { activeTab } = this.state;
    // TODO: handle when nothing found
    return (
      <React.Fragment>
        <Wrapper regularPadding>
          <TabWrapper>
            <TabItem
              active={activeTab === 'RECEIVED'}
              onPress={() => this.setState({ activeTab: 'RECEIVED' })}
            >
              <TabItemText active={activeTab === 'RECEIVED'}>Received</TabItemText>
            </TabItem>
            <TabItem
              active={activeTab === 'SENT'}
              onPress={() => this.setState({ activeTab: 'SENT' })}
            >
              <TabItemText>Sent</TabItemText>
            </TabItem>
          </TabWrapper>
        </Wrapper>
        <ContactCardList
          contentInset={{ bottom: 40 }}
        >
          <ContactCard
            onPress={this.handleContactCardPress}
            onAcceptInvitationPress={this.handleAcceptInvitationPress}
            onRejectInvitationPress={this.handleRejectInvitatonPress}
            onCancelInvitationPress={this.handleCancelInvitationPress}
            name="John Doe"
            status="RECEIVED"
            showActions
          />
          <ContactCard
            onPress={this.handleContactCardPress}
            onAcceptInvitationPress={this.handleAcceptInvitationPress}
            onRejectInvitationPress={this.handleRejectInvitatonPress}
            onCancelInvitationPress={this.handleCancelInvitationPress}
            name="David Bowie"
            status="ACCEPTED"
            showActions
          />
          <ContactCard
            onPress={this.handleContactCardPress}
            onAcceptInvitationPress={this.handleAcceptInvitationPress}
            onRejectInvitationPress={this.handleRejectInvitatonPress}
            onCancelInvitationPress={this.handleCancelInvitationPress}
            name="Vitalik Satoshi"
            status="DECLINED"
            showActions
          />
          <ContactCard
            onPress={this.handleContactCardPress}
            onAcceptInvitationPress={this.handleAcceptInvitationPress}
            onRejectInvitationPress={this.handleRejectInvitatonPress}
            onCancelInvitationPress={this.handleCancelInvitationPress}
            name="Beta Alpha"
            status="SENT"
            showActions
          />
        </ContactCardList>
      </React.Fragment>
    );
  }
}
