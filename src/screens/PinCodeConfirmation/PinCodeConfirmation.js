// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { Container } from 'components/Layout';
import type { NavigationScreenProp } from 'react-navigation';
import Header from 'components/Header';
import PinCode from 'components/PinCode';
import ErrorMessage from 'components/ErrorMessage';
import { confirmPinForNewWalletAction } from 'actions/walletActions';
import { validatePin } from 'utils/validators';
import { PIN_CODE_CONFIRMATION } from 'constants/navigationConstants';

type Props = {
  confirmPinForNewWallet: (pin: string) => Function,
  navigation: NavigationScreenProp<*>,
  wallet: Object,
};

type State = {
  errorMessage: string,
};

class PinCodeConfirmation extends React.Component<Props, State> {
  state = {
    errorMessage: '',
  };

  constructor(props) {
    super(props);
    this.props.navigation.state.key = PIN_CODE_CONFIRMATION;
  }

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
        {!!this.state.errorMessage && <ErrorMessage>{this.state.errorMessage}</ErrorMessage>}
        <Header title="confirm pincode" onBack={() => this.props.navigation.goBack(null)} />
        <PinCode
          onPinEntered={this.handlePinSubmit}
          onPinChanged={this.handlePinChange}
          pageInstructions="Confirm your Pincode"
          showForgotButton={false}
          pinError={!!this.state.errorMessage}
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
