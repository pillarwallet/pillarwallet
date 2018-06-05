// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { Container, Center, Wrapper } from 'components/Layout';
import { CloseButton } from 'components/Button/CloseButton';
import Title from 'components/Title';
import PinCode from 'components/PinCode';
import { UIColors } from 'utils/variables';
import { CHANGE_PIN_CONFIRM_NEW_PIN } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
}

export default class NewPin extends React.Component<Props> {
  handlePinSubmit = (pin: string) => {
    this.props.navigation.navigate(CHANGE_PIN_CONFIRM_NEW_PIN, { pin });
  };

  handleScreenDissmisal = () => {
    this.props.navigation.goBack(null);
  };

  render() {
    return (
      <Container>
        <CloseButton
          icon="md-close"
          onPress={this.handleScreenDissmisal}
          color={UIColors.primary}
          fontSize={32}
        />
        <Wrapper style={{ marginTop: 40 }}>
          <Center>
            <Title center title="enter new pincode" />
          </Center>
          <PinCode
            onPinEntered={this.handlePinSubmit}
            pageInstructions=""
            showForgotButton={false}
          />
        </Wrapper>
      </Container>
    );
  }
}
