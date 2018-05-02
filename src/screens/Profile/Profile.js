// @flow
import * as React from 'react';

import { AsyncStorage, Text } from 'react-native';
import { Container, Footer } from 'components/Layout';
import Title from 'components/Title';
import Button from 'components/Button';

type State = {
  status: string,
}

export default class Profile extends React.Component<{}, State> {
  state = {
    status: '',
  };

  clearLocalStorage = () => {
    AsyncStorage.clear();
    this.setState({
      status: 'Cleared',
    });
  };

  render() {
    const { status } = this.state;
    return (
      <Container>
        <Title center>Profile</Title>
        <Footer>
          <Button
            block
            marginBottom="20px"
            title="Clear Local Storage"
            onPress={this.clearLocalStorage}
          />
          {status && <Text>{status}</Text>}
        </Footer>
      </Container>
    );
  }
}
