// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Icon } from 'native-base';
import { baseColors, UIColors, fontSizes } from 'utils/variables';
import type { NavigationScreenProp } from 'react-navigation';
import { CONTACT, CONNECTION_REQUESTS } from 'constants/navigationConstants';
import { Container, Wrapper, ScrollWrapper } from 'components/Layout';
import Title from 'components/Title';
import ContactCard from 'components/ContactCard';
import NotificationCircle from 'components/NotificationCircle';
import SearchBar from 'components/SearchBar';

type Props = {
  navigation: NavigationScreenProp<*>,
}

type State = {
  value: string,
}

const ConnectionRequestBanner = styled.TouchableHighlight`
  height: 60px;
  padding-left: 30px;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${UIColors.defaultBorderColor};
  align-items: center;
  flex-direction: row;
`;

const ConnectionRequestBannerText = styled.Text`
  font-size: ${fontSizes.medium};
`;

const ConnectionRequestBannerIcon = styled(Icon)`
  font-size: ${fontSizes.medium};
  color: ${baseColors.darkGray};
  margin-left: auto;
  margin-right: 16px;
`;

const ConnectionRequestNotificationCircle = styled(NotificationCircle)`
  margin-left: 10px;
`;

const ContactCardList = styled(ScrollWrapper)`
  padding: 16px;
`;

export default class People extends React.Component<Props, State> {
  state = {
    value: '',
  }

  handleSearchChange = () => {

  };

  handleContactCardPress = () => {
    this.props.navigation.navigate(CONTACT);
  }

  handleConnectionsRequestBannerPress = () => {
    this.props.navigation.navigate(CONNECTION_REQUESTS);
  }

  render() {
    return (
      <Container>
        <Wrapper regularPadding>
          <Title title="people" />
          <SearchBar
            inputProps={{
              onChange: this.handleSearchChange,
              value: this.state.value,
            }}
          />
        </Wrapper>
        <ConnectionRequestBanner
          onPress={this.handleConnectionsRequestBannerPress}
          underlayColor={baseColors.lightGray}
        >
          <React.Fragment>
            <ConnectionRequestBannerText>
              Connection requests
            </ConnectionRequestBannerText>
            <ConnectionRequestNotificationCircle>
              5
            </ConnectionRequestNotificationCircle>
            <ConnectionRequestBannerIcon name="arrow-forward" />
          </React.Fragment>
        </ConnectionRequestBanner>
        <ContactCardList
          contentInset={{ bottom: 40 }}
        >
          <ContactCard
            onPress={this.handleContactCardPress}
            name="John Doe"
          />
          <ContactCard
            onPress={this.handleContactCardPress}
            name="David Bowie"
            notificationCount={4}
          />
          <ContactCard
            onPress={this.handleContactCardPress}
            name="Vitalik Satoshi"
          />
          <ContactCard
            onPress={this.handleContactCardPress}
            name="Beta Alpha"
          />

        </ContactCardList>
      </Container>
    );
  }
}
