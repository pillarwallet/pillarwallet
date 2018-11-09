// @flow
import * as React from 'react';
import type { NavigationScreenProp } from 'react-navigation';
import { Container } from 'components/Layout';
import Header from 'components/Header';
import PinCode from 'components/PinCode';
import ErrorMessage from 'components/ErrorMessage';
import { CHANGE_PIN_CONFIRM_NEW_PIN } from 'constants/navigationConstants';

type Props = {
  navigation: NavigationScreenProp<*>,
  pin: string,
};

type State = {
  pinError: string,
};

export default class NewPin extends React.Component<Props, State> {
  state = {
    pinError: '',
  };

  handlePinSubmit = (newPin: string) => {
    const { navigation } = this.props;
    const currentPin = navigation.getParam('currentPin');

    if (currentPin === newPin) {
      this.setState({
        pinError: 'New pincode must be different from the current one',
      });
      return;
    }

    navigation.navigate(CHANGE_PIN_CONFIRM_NEW_PIN, {
      currentPin,
      newPin,
    });
  };

  handlePinChange = () => {
    this.setState({
      pinError: '',
    });
  };

  handleScreenDismissal = () => {
    this.props.navigation.dismiss();
  };

  render() {
    const { pinError } = this.state;
    const showError = pinError ? <ErrorMessage>{pinError}</ErrorMessage> : null;

    return (
      <Container>
        <Header
          title="enter new pincode"
          centerTitle
          onClose={this.handleScreenDismissal}
        />
        {showError}
        <PinCode
          onPinEntered={this.handlePinSubmit}
          onPinChanged={this.handlePinChange}
          pageInstructions=""
          showForgotButton={false}
          pinError={!!pinError}
        />
      </Container>
    );
  }
}
