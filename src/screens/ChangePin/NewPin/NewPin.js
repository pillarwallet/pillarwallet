// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { Container } from 'components/Layout';
import Header from 'components/Header';
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
        <Header
          title="enter new pincode"
          centerTitle
          onClose={this.handleScreenDismissal}
        />
        <PinCode
          onPinEntered={this.handlePinSubmit}
          pageInstructions=""
          showForgotButton={false}
        />
      </Container>
    );
  }
}
