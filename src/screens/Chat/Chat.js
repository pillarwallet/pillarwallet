// @flow
import * as React from 'react';
import { Text } from 'react-native';
import { Container, Wrapper } from 'components/Layout';
import ButtonText from 'components/ButtonText';
import type { NavigationScreenProp } from 'react-navigation';

type Props = {
  navigation: NavigationScreenProp<*>,
}

type State = {}

export default class ChatScreen extends React.Component<Props, State> {
  state = {};

  goBackToChatListScreen = () => {
    this.props.navigation.goBack();
  };

  render() {
    return (
      <Container>
        <Wrapper regularPadding>
          <ButtonText buttonText="To chat list" onPress={this.goBackToChatListScreen} />
          <Text>Chat</Text>
        </Wrapper>
      </Container>
    );
  }
}
