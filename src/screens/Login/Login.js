// @flow
import React from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableHighlight,
  ActivityIndicator,
} from 'react-native';
import { connect } from 'react-redux';
import { decryptWalletAction } from '../../actions/walletActions';
import { validatePin } from '../../utils/validators';
import { DECRYPTING, DECRYPTED } from '../../constants/walletConstants';

import styles from './styles';

type Props = {
  decryptWallet: (pin: string) => Function,
  wallet: Object
}

type State = {
  pin: string,
  pinError: string,
};

class Login extends React.Component<Props, State> {
  state = {
    pin: '',
    pinError: '',
  };

  handlePinSubmit = () => {
    const { pin } = this.state;
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
    const {
      pin,
      pinError,
    } = this.state;
    
    const showError = pinError ? <Text style={styles.errorText}>{pinError}</Text> : null
    
    const { walletState, data: wallet } = this.props.wallet;

    // if (!encryptedWallet && !encryptedWalletExists) {
    //   return (
    //     <View style={styles.container}>
    //       <Text style={styles.title}>No wallet is stored on this device</Text>
    //     </View>
    //   );
    // }

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
        <Text style={styles.title}>Enter your pin</Text>
        <View>
          <TextInput
            style={styles.pinInput}
            value={pin}
            onChangeText={text => this.setState({ pin: text })}
          />
          <TouchableHighlight
            style={styles.submitButton}
            underlayColor="white"
            onPress={this.handlePinSubmit}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableHighlight>
        </View>
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


export default connect(mapStateToProps, mapDispatchToProps )(Login);
