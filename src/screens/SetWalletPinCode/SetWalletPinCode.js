// @flow
import * as React from 'react';
import { Text } from 'react-native';
import { connect } from 'react-redux';

import Container from 'components/Container';
import Title from 'components/Title';
import PinCode from 'components/PinCode';

import { setPinForNewWalletAction } from 'actions/walletActions';
import { NEW_WALLET_PIN_ERROR, WALLET_ERROR } from 'constants/walletConstants';

type Props = {
  setPinForNewWallet: (pin: string) => Function,
  wallet: Object,
};

class SetWalletPinCode extends React.Component<Props, {}> {
  handlePinSubmit = (pin: string) => {
    this.props.setPinForNewWallet(pin);
  };

  render() {
    const { walletState, error } = this.props.wallet;
    const showError = walletState === WALLET_ERROR && error.code === NEW_WALLET_PIN_ERROR
      ? <Text>{error.message}</Text>
      : null;

    return (
      <Container>
        <Title center>Enter Passcode</Title>
        <PinCode
          onPinEntered={this.handlePinSubmit}
          pageInstructions="Setup your Passcode"
          showForgotButton={false}
        />
        {showError}
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  setPinForNewWallet: (pin) => {
    dispatch(setPinForNewWalletAction(pin));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(SetWalletPinCode);
