// @flow
import * as React from 'react';
import { Text } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import Header from 'components/Header';
import Button from 'components/Button';
import { ICO_INSTRUCTIONS } from 'constants/navigationConstants';
import { Container, Wrapper } from 'components/Layout';

type Props = {
  navigation: NavigationScreenProp<*>,
}

type State = {};

class ParticipateScreen extends React.Component<Props, State> {
  navigateBack = () => {
    this.props.navigation.goBack(null);
  };

  navigateToInstructions = () => {
    this.props.navigation.navigate(ICO_INSTRUCTIONS);
  };

  render() {
    return (
      <Container>
        <Header
          onBack={this.navigateBack}
          title="participate"
        />
        <Wrapper flex={1} regularPadding center>
          <Text>Participate</Text>
          <Button block title="Next" onPress={this.navigateToInstructions} />
        </Wrapper>
      </Container>
    );
  }
}

export default ParticipateScreen;
