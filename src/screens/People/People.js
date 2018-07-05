// @flow
import * as React from 'react';
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
          <ScrollWrapper>
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
          </ScrollWrapper>
        </Wrapper>
      </Container>
    );
  }
}
