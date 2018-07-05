// @flow
import * as React from 'react';
import { Text } from 'react-native';
import { Container, Wrapper } from 'components/Layout';
import ButtonText from 'components/ButtonText';
import type { NavigationScreenProp } from 'react-navigation';
import { CHAT } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
}

type State = {}

export default class ChatListScreen extends React.Component<Props, State> {
  state = {};

  goToChatScreen = () => {
    this.props.navigation.navigate(CHAT);
  };

  render() {
    return (
      <Container>
        <Wrapper regularPadding>
          <Text>Chat List</Text>
          <ButtonText buttonText="To chat" onPress={this.goToChatScreen} />
        </Wrapper>
      </Container>
    );
  }
}
