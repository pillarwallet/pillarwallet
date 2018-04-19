// @flow
import * as React from 'react';
import { Text } from 'react-native';
import { connect } from 'react-redux';

import Container from 'components/Container';
import Title from 'components/Title';
import PinCode from 'components/PinCode';

import { confirmPinForNewWalletAction } from 'actions/walletActions';
import { NEW_WALLET_PIN_CONFIRM_ERROR, WALLET_ERROR } from 'constants/walletConstants';

type Props = {
  confirmPinForNewWallet: (pin: string) => Function,
  wallet: Object,
};

type State = {
  showError: boolean,
  errorMessage: string,
};

class PinCodeConfirmation extends React.Component<Props, State> {
  state = {
    showError: false,
    errorMessage: '',
  };

  static getDerivedStateFromProps(nextProps, prevState) {
    const { walletState, error } = nextProps.wallet;

    const showError = walletState === WALLET_ERROR && error.code === NEW_WALLET_PIN_CONFIRM_ERROR;
    const errorMessage = showError && error.message;

    return {
      ...prevState,
      showError,
      errorMessage,
    };
  }

  handlePinSubmit = (pin: string) => {
    this.props.confirmPinForNewWallet(pin);
  };

  handlePinChange = () => {
    this.setState({
      showError: false,
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
        {this.state.showError && <Text>{this.state.errorMessage}</Text>}
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
