// @flow
import * as React from 'react';
import { Text } from 'react-native';
import { connect } from 'react-redux';

import Container from 'components/Container';
import {Title} from 'components/Typography';
import PinCode from 'components/PinCode';

import { confirmPinForNewWalletAction } from 'actions/walletActions';
import { validatePin } from 'utils/validators';

type Props = {
  confirmPinForNewWallet: (pin: string) => Function,
  wallet: Object,
};

type State = {
  errorMessage: string,
};

class PinCodeConfirmation extends React.Component<Props, State> {
  state = {
    errorMessage: '',
  };

  handlePinSubmit = (pin: string) => {
    const { onboarding: wallet } = this.props.wallet;
    const previousPin = wallet.pin;
    const validationError = validatePin(pin, previousPin);

    if (validationError) {
      this.setState({
        errorMessage: validationError,
      });
      return;
    }

    this.props.confirmPinForNewWallet(pin);
  };

  handlePinChange = () => {
    this.setState({
      errorMessage: '',
    });
  };

  render() {
    return (
      <Container>
        <Title center>Confirm Passcode</Title>
        <PinCode
          onPinEntered={this.handlePinSubmit}
          onPinChanged={this.handlePinChange}
          pageInstructions="Confirm your Passcode"
          showForgotButton={false}
        />
        {this.state.errorMessage && <Text>{this.state.errorMessage}</Text>}
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  confirmPinForNewWallet: (pin) => {
    dispatch(confirmPinForNewWalletAction(pin));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(PinCodeConfirmation);
