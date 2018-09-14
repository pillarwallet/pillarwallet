// @flow
import * as React from 'react';
import { Text } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import Header from 'components/Header';
import Button from 'components/Button';
import { ICO_CONFIRM } from 'constants/navigationConstants';
import { Container, Wrapper } from 'components/Layout';

type Props = {
  navigation: NavigationScreenProp<*>,
}
type State = {};

class InstructionsScreen extends React.Component<Props, State> {
  navigateBack = () => {
    this.props.navigation.goBack();
  };

  navigateToConfirm = () => {
    this.props.navigation.navigate(ICO_CONFIRM);
  };

  render() {
    return (
      <Container>
        <Header
          onBack={this.navigateBack}
          title="funding instructions"
        />
        <Wrapper flex={1} regularPadding center>
          <Text>Instructions</Text>
          <Button block title="Next" onPress={this.navigateToConfirm} />
        </Wrapper>
      </Container>
    );
  }
}

export default InstructionsScreen;
