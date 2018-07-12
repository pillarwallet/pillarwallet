// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import { baseColors, fontSizes, fontWeights } from 'utils/variables';
import { CONTACT } from 'constants/navigationConstants';
import { Container, Wrapper, ScrollWrapper } from 'components/Layout';
import Title from 'components/Title';
import ContactCard from 'components/ContactCard';

type Props = {
  navigation: NavigationScreenProp<*>,
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
  font-weight: ${props => props.active ? fontWeights.bold : fontWeights.book};
`;

export default class ConnectionRequests extends React.Component<Props, State> {
  state = {
    activeTab: 'RECEIVED',
  }

  handleSearchChange = () => {

  };

  handleContactCardPress = () => {
    this.props.navigation.navigate(CONTACT);
  }

  handleConnectionsRequestBannerPress = () => {
    this.props.navigation.navigate(CONTACT);
  }

  handleAcceptInvitationPress = () => {
  }

  handleRejectInvitatonPress = () => {
  }

  handleCancelInvitationPress = () => {
  }


  render() {
    return (
      <Container>
        <Wrapper regularPadding>
          <Title title="connection requests" />
          <TabWrapper>
            <TabItem
              active={this.state.activeTab === 'RECEIVED'}
              onPress={() => this.setState({ activeTab: 'RECEIVED' })}
            >
              <TabItemText active={this.state.activeTab === 'RECEIVED'}>Received</TabItemText>
            </TabItem>
            <TabItem
              active={this.state.activeTab === 'SENT'}
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
      </Container>
    );
  }
}
