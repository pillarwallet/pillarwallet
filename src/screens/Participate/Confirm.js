// @flow
import * as React from 'react';
import { Text } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import Header from 'components/Header';
import Button from 'components/Button';
import { Container, Wrapper } from 'components/Layout';

type Props = {
  navigation: NavigationScreenProp<*>,
}
type State = {};

class ConfirmScreen extends React.Component<Props, State> {
  navigateBack = () => {
    this.props.navigation.goBack();
  };

  endFlow = () => {
    this.props.navigation.dismiss();
  };

  render() {
    return (
      <Container>
        <Header
          onBack={this.navigateBack}
          title="review and confirm"
        />
        <Wrapper flex={1} regularPadding center>
          <Text>Confirm</Text>
          <Button block title="Confirm transaction" onPress={this.endFlow} />
        </Wrapper>
      </Container>
    );
  }
}

export default ConfirmScreen;
