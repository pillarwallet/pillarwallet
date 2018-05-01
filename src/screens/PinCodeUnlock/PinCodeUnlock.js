// @flow
import * as React from 'react';
import { Text, ActivityIndicator } from 'react-native';
import { connect } from 'react-redux';
import { DECRYPTING, DECRYPTED, INVALID_PASSWORD } from 'constants/walletConstants';
import { decryptWalletAction } from 'actions/walletActions';
import { validatePin } from 'utils/validators';
import { Container, Center } from 'components/Layout';
import { Title } from 'components/Typography';
import PinCode from 'components/PinCode';

type Props = {
  decryptWallet: (pin: string) => Function,
  wallet: Object
}

type State = {
  pinError: string,
};

class PinCodeUnlock extends React.Component<Props, State> {
  state = {
    pinError: '',
  };

  componentWillReceiveProps(nextProps: Props) {
    const { walletState } = nextProps.wallet;
    if (walletState === INVALID_PASSWORD) {
      this.setState({ pinError: 'Invalid password' });
    }
  }

  handlePinSubmit = (pin: string) => {
    const validationError = validatePin(pin);
    const { decryptWallet } = this.props;
    if (validationError) {
      this.setState({
        pinError: validationError,
      });
      return;
    }
    this.setState({
      pinError: validationError,
    });
    decryptWallet(pin);
  };

  render() {
    const { pinError } = this.state;

    const showError = pinError ? <Text>{pinError}</Text> : null;
    const { walletState } = this.props.wallet;

    if (walletState === DECRYPTING) {
      return (
        <Container center>
          <Text style={{ marginBottom: 20 }}>{walletState}</Text>
          <ActivityIndicator
            animating
            color="#111"
            size="large"
          />
        </Container>
      );
    }

    if (walletState === DECRYPTED) return null;

    return (
      <Container>
        <Center>
          <Title>Enter Passcode</Title>
        </Center>
        <PinCode
          onPinEntered={this.handlePinSubmit}
          pageInstructions=""
        />
        {showError}
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  decryptWallet: (pin: string) => {
    dispatch(decryptWalletAction(pin));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(PinCodeUnlock);
