// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { Container, Center } from 'components/Layout';
import ModalScreenHeader from 'components/ModalScreenHeader';
import Title from 'components/Title';
import PinCode from 'components/PinCode';
import { CHANGE_PIN_CONFIRM_NEW_PIN } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
}

export default class NewPin extends React.Component<Props> {
  handlePinSubmit = (pin: string) => {
    this.props.navigation.navigate(CHANGE_PIN_CONFIRM_NEW_PIN, { pin });
  };

  handleScreenDismissal = () => {
    this.props.navigation.dismiss();
  };

  render() {
    return (
      <Container>
        <ModalScreenHeader onClose={this.handleScreenDismissal} />
        <Center>
          <Title align="center" title="enter new pincode" />
        </Center>
        <PinCode
          onPinEntered={this.handlePinSubmit}
          pageInstructions=""
          showForgotButton={false}
        />
      </Container>
    );
  }
}
