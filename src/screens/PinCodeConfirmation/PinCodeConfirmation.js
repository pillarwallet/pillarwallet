// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { Container, Center } from 'components/Layout';
import { Title } from 'components/Typography';
import PinCode from 'components/PinCode';
import ErrorMessage from 'components/ErrorMessage';
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
        {this.state.errorMessage && <ErrorMessage>{this.state.errorMessage}</ErrorMessage>}
        <Center>
          <Title>Confirm Passcode</Title>
        </Center>
        <PinCode
          onPinEntered={this.handlePinSubmit}
          onPinChanged={this.handlePinChange}
          pageInstructions="Confirm your Passcode"
          showForgotButton={false}
        />
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
