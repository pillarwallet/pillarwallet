// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Icon } from 'native-base';
import { baseColors, UIColors, fontSizes } from 'utils/variables';
import type { NavigationScreenProp } from 'react-navigation';
import { CONTACT } from 'constants/navigationConstants';
import { Container, Wrapper, ScrollWrapper } from 'components/Layout';
import Title from 'components/Title';
import ContactCard from 'components/ContactCard';

type Props = {
  navigation: NavigationScreenProp<*>,
}

type State = {
  value: string,
}

const ContactCardList = styled(ScrollWrapper)`
  padding: 16px;
`;

export default class ConnectionRequests extends React.Component<Props, State> {
  state = {
    value: '',
  }

  handleSearchChange = () => {

  };

  handleContactCardPress = () => {
    this.props.navigation.navigate(CONTACT);
  }

  handleConnectionsRequestBannerPress = () => {
    this.props.navigation.navigate(CONTACT);
  }

  render() {
    return (
      <Container>
        <Wrapper regularPadding>
          <Title title="connection requests" />
        </Wrapper>
        <ContactCardList
          contentInset={{ bottom: 40 }}
        >
          <ContactCard
            onPress={this.handleContactCardPress}
            name="John Doe"
            status="RECEIVED"
            showActions
          />
          <ContactCard
            onPress={this.handleContactCardPress}
            name="David Bowie"
            status="ACCEPTED"
            showActions
          />
          <ContactCard
            onPress={this.handleContactCardPress}
            name="Vitalik Satoshi"
            status="DECLINED"
            showActions
          />
          <ContactCard
            onPress={this.handleContactCardPress}
            name="Beta Alpha"
            status="SENT"
            showActions
          />

        </ContactCardList>
      </Container>
    );
  }
}
