// @flow
import * as React from 'react';
import {
  Text,
  View,
  TouchableHighlight,
  ActivityIndicator,
} from 'react-native';
import { NavigationActions } from 'react-navigation';
import type { NavigationScreenProp } from 'react-navigation';
import { connect } from 'react-redux';
import ethers from 'ethers';

import PinCode from 'components/PinCode';
import { generateEncryptedWalletAction } from 'actions/walletActions';
import { ENCRYPTING, CREATED, GENERATING } from 'constants/walletConstants';
import { validatePin } from 'utils/validators';
import styles from './styles';

type State = {
  mnemonic: string,
  pin: string,
  pinError: string
};

type Props = {
  navigation: NavigationScreenProp<*>,
  generateEncryptedWallet: (mnemonic: string, pin: string) => Function,
  wallet: Object,
};

class NewWallet extends React.Component<Props, State> {
  state = {
    mnemonic: '',
    pin: '',
    pinError: '',
  };

  handlePinSubmit = (pin: string) => {
    const validationError = validatePin(pin);
    const { generateEncryptedWallet } = this.props;

    if (validationError) {
      this.setState({
        pinError: validationError,
      });
      return;
    }
    const mnemonic = ethers.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));
    generateEncryptedWallet(mnemonic, pin);

    this.setState({
      pin,
      mnemonic,
    });
  };

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
      pin,
      pinError,
    } = this.state;

    const { walletState, data: wallet } = this.props.wallet;

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
      );
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
      );
    }

    const showError = pinError ? <Text style={styles.errorText}>{pinError}</Text> : null;

    return (
      <View style={styles.enterPinContainer}>
        <PinCode
          onPinEntered={this.handlePinSubmit}
          pageHeading="Enter Passcode"
          pageInstructions="Setup your Passcode"
          showForgotButton={false}
        />
        {showError}
      </View>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  generateEncryptedWallet: (mnemonic, pin) =>
    dispatch(generateEncryptedWalletAction(mnemonic, pin)),
});

export default connect(mapStateToProps, mapDispatchToProps)(NewWallet);
