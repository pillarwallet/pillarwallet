// @flow
import * as React from 'react';

import { AsyncStorage, Text } from 'react-native';
import { Container, Footer } from 'components/Layout';
import { Form } from 'native-base';
import Title from 'components/Title';
import Button from 'components/Button';
import TextInput from 'components/TextInput';
import ProfileHeader from './ProfileHeader';
import ProfileCard from './ProfileCard';

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
        <ProfileHeader>
          <Title title="profile" />
          <ProfileCard name="David Bowie" email="johndoe@email.com" />
        </ProfileHeader>
        <Form>
          <TextInput
            id="country"
            label="Country"
            inlineLabel
            inputProps={{}}
          />
        </Form>
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
