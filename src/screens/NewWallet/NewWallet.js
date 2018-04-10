// @flow
import * as React from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableHighlight,
  ActivityIndicator,
  AsyncStorage,
} from 'react-native';
import { NavigationActions } from 'react-navigation';
import { generateEncryptedWalletAction } from '../../actions/walletActions';
import { ENCRYPTING, CREATED, GENERATING } from '../../constants/walletConstants';
import { connect } from 'react-redux'
import ethers from 'ethers';
import styles from './styles';

class NewWallet extends React.Component {
  state = {
    mnemonic: '',
    wallet: {},
    walletCreated: false,
    pin: '',
    pinError: '',
    showLoader: false,
  };

  handlePinChange = (event) => {
    this.setState({
      pin: event.nativeEvent.text,
    });
  };

  handlePinSubmit = () => {
    const validationError = this.validatePin(this.state.pin);
    const { generateEncryptedWallet } = this.props
    if (validationError) {
      this.setState({
        pinError: validationError,
      });
      return;
    }
    const mnemonic = ethers.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));
    generateEncryptedWallet(mnemonic, this.state.pin)
  };

  validatePin(pin) {
    if (pin.length !== 6) {
      return "Invalid pin's length (should be 6 numbers)";
    } else if (!pin.match(/^\d+$/)) {
      return 'Pin could contain numbers only';
    }
    return '';
  }

  goToLoginPage = () => {
    const resetAction = NavigationActions.reset({
      index: 0,
      actions: [NavigationActions.navigate({ routeName: 'Login' })],
    });
    this.props.navigation.dispatch(resetAction);
  };

  render() {
    const {
      mnemonic,
      wallet,
      walletCreated,
      pin,
      pinError,
      showLoader,
    } = this.state;

    const { walletState } = this.props.wallet

    if (walletState === CREATED) {
      return (
        <View style={styles.pinCodeCreatedContainer}>
          <Text style={styles.textRow}>Password: {pin}</Text>
          <Text style={styles.textRow}>Mnemonic: {mnemonic}</Text>
          <Text style={styles.textRow}>Public address: {wallet.address}</Text>
          <Text style={styles.textRow}>Private key: {wallet.privateKey}</Text>

          <TouchableHighlight
            style={styles.submitButton}
            onPress={this.goToLoginPage}
          >
            <Text style={styles.buttonText}>Login</Text>
          </TouchableHighlight>
        </View>
      )
    }

    if (walletState === GENERATING || walletState === ENCRYPTING) {
      return (
        <View>
          <Text>{walletState}</Text>
          <ActivityIndicator
            animating
            color="#111"
            size="large"
          />
        </View>
      )
    }

    const showError = (
      pinError ?
        <Text style={styles.errorText}>{pinError}</Text> :
        null
    );

    return (
      <View style={styles.enterPinContainer}>
        <Text style={styles.title}>Enter your pin</Text>
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
              <Text style={styles.buttonText}>Submit</Text>
            </TouchableHighlight>
          </View>
        {showError}
      </View>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({
  wallet
})

const mapDispatchToProps = (dispatch) => ({
  generateEncryptedWallet: (mnemonic, pin) => dispatch(generateEncryptedWalletAction(mnemonic, pin))
})

export default connect(mapStateToProps, mapDispatchToProps)(NewWallet)