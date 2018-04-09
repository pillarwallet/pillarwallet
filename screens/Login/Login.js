// @flow
import * as React from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableHighlight,
  ActivityIndicator, AsyncStorage,
} from 'react-native';
import ethers from 'ethers';
import styles from './styles';

export default class Login extends React.Component {
  state = {
    showLoader: false,
    encryptedWallet: null,
    encryptedWalletExists: true,
    pin: '',
    pinError: '',
    decryptedWallet: null,
  };

  async componentDidMount() {
    let wallet = null;
    try {
      wallet = await AsyncStorage.getItem('wallet').then(JSON.parse);
    } catch (e) {
      // empty
    }

    // eslint-disable-next-line
    this.setState({
      encryptedWalletExists: !!wallet,
      encryptedWallet: wallet,
    });
  }

  handlePinChange = (event) => {
    this.setState({
      pin: event.nativeEvent.text,
    });
  };

  handlePinSubmit = () => {
    const validationError = this.validatePin(this.state.pin);
    if (validationError) {
      this.setState({
        pinError: validationError,
      });
      return;
    }

    const timeout = setTimeout(() => {
      this.decryptWallet(this.state.encryptedWallet, this.state.pin);
      clearTimeout(timeout);
    }, 0);

    this.setState({
      pinError: '',
      showLoader: true,
    });
  };

  decryptWallet(encryptedWallet, password) {
    // eslint-disable-next-line
    console.log(encryptedWallet, password);
    ethers.Wallet.fromEncryptedWallet(encryptedWallet, password)
      .then((wallet) => {
        this.setState({
          decryptedWallet: wallet,
          showLoader: false,
        });
      })
      .catch(() => {
        this.setState({
          pinError: 'Incorrect pin code',
          showLoader: false,
        });
      });
  }

  validatePin(pin) {
    if (pin.length !== 6) {
      return "Invalid pin's length (should be 6 numbers)";
    } else if (!pin.match(/^\d+$/)) {
      return 'Pin could contain numbers only';
    }
    return '';
  }

  render() {
    const {
      showLoader,
      pin,
      pinError,
      encryptedWallet,
      encryptedWalletExists,
      decryptedWallet,
    } = this.state;

    const showError = (
      pinError ? <Text style={styles.errorText}>{pinError}</Text> : null
    );

    if (!encryptedWallet && !encryptedWalletExists) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>No wallet is stored on this device</Text>
        </View>
      );
    }

    if (!encryptedWallet && encryptedWalletExists) {
      return (
        <View style={styles.container}>
          <ActivityIndicator
            animating={showLoader}
            color="#111"
            size="large"
          />
        </View>
      );
    }

    if (decryptedWallet) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>Wallet unlocked</Text>
          <Text style={styles.title}>Public address: {decryptedWallet.address}</Text>
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Enter your pin</Text>
        {!showLoader && (
          <View>
            <TextInput
              style={styles.pinInput}
              value={pin}
              onChange={this.handlePinChange}
            />
            <TouchableHighlight
              style={styles.submitButton}
              underlayColor="white"
              onPress={this.handlePinSubmit}
            >
              <Text style={styles.buttonText}>Login</Text>
            </TouchableHighlight>
          </View>
        )}

        {showError}

        <ActivityIndicator
          animating={showLoader}
          color="#111"
          size="large"
        />
      </View>
    );
  }
}
