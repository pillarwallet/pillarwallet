// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { UIColors, fontSizes } from 'utils/variables';
import type { NavigationScreenProp } from 'react-navigation';
import { CONTACT } from 'constants/navigationConstants';
import { Container, Wrapper, ScrollWrapper } from 'components/Layout';
import Title from 'components/Title';
import ContactCard from 'components/ContactCard';
import SearchBar from 'components/SearchBar';

type Props = {
  navigation: NavigationScreenProp<*>,
}

type State = {
  value: string,
}

const ConnectionRequestBanner = styled.View`
  height: 60px;
  padding-left: 30px;
  border-top-width: 1px;
  border-bottom-width: 1px;
  border-color: ${UIColors.defaultBorderColor};
  justify-content: center;
`;

const ConnectionRequestBannerText = styled.Text`
  font-size: ${fontSizes.medium};
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
        <ConnectionRequestBanner>
          <ConnectionRequestBannerText>Connection requests</ConnectionRequestBannerText>
        </ConnectionRequestBanner>
        <ContactCardList
          contentInset={{ bottom: 46 }}
        >
          <ContactCard onPress={this.handleContactCardPress} />
          <ContactCard onPress={this.handleContactCardPress} />
          <ContactCard onPress={this.handleContactCardPress} />
          <ContactCard onPress={this.handleContactCardPress} />
          <ContactCard onPress={this.handleContactCardPress} />
          <ContactCard onPress={this.handleContactCardPress} />
          <ContactCard onPress={this.handleContactCardPress} />
          <ContactCard onPress={this.handleContactCardPress} />
          <ContactCard onPress={this.handleContactCardPress} />
          <ContactCard onPress={this.handleContactCardPress} />
          <ContactCard onPress={this.handleContactCardPress} />
          <ContactCard onPress={this.handleContactCardPress} />
          <ContactCard onPress={this.handleContactCardPress} />
          <ContactCard onPress={this.handleContactCardPress} />
          <ContactCard onPress={this.handleContactCardPress} />
          <ContactCard onPress={this.handleContactCardPress} />
        </ContactCardList>
      </Container>
    );
  }
}
