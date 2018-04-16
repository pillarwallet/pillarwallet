// @flow
import * as React from 'react';
import {
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { connect } from 'react-redux';
import { decryptWalletAction } from 'actions/walletActions';
import { validatePin } from 'utils/validators';
import { DECRYPTING, DECRYPTED, INVALID_PASSWORD } from 'constants/walletConstants';
import PinCode from 'components/PinCode';

import styles from './styles';

type Props = {
  decryptWallet: (pin: string) => Function,
  wallet: Object
}

type State = {
  pinError: string,
};

class Login extends React.Component<Props, State> {
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

    const showError = pinError ? <Text style={styles.errorText}>{pinError}</Text> : null;
    const { walletState, data: wallet } = this.props.wallet;

    if (walletState === DECRYPTING) {
      return (
        <View>
          <Text>{walletState}</Text>
          <ActivityIndicator
            animating
            color="#111"
            size="large"
          />
        </View>
      );
    }

    if (walletState === DECRYPTED) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Wallet unlocked</Text>
          <Text style={styles.title}>Public address: {wallet.address}</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <PinCode
          onPinEntered={this.handlePinSubmit}
          pageHeading="Enter Passcode"
          pageInstructions=""
        />
        {showError}
      </View>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  decryptWallet: (pin: string) =>
    dispatch(decryptWalletAction(pin)),
});

export default connect(mapStateToProps, mapDispatchToProps)(Login);
