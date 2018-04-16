// @flow
import * as React from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableHighlight,
  ActivityIndicator,
} from 'react-native';
import { connect } from 'react-redux';

import {
  importWalletFromTWordsPhraseAction,
  importWalletFromPrivateKeyAction,
  setPinForImportedWalletAction,
} from 'actions/walletActions';

import {
  IMPORTED,
  WALLET_ERROR,
  IMPORT_ERROR,
  IMPORT_SET_PIN,
  ENCRYPTING,
} from 'constants/walletConstants';

import PinCode from 'components/PinCode';
import styles from './styles';

type Props = {
  importWalletFromTWordsPhrase: (tWordsPhrase: string) => Function,
  importWalletFromPrivateKey: (privateKey: string) => Function,
  encryptWithPinCode: (pin: string, wallet: Object) => Function,
  wallet: Object,
};

type State = {
  showLoader: boolean,
  privateKey: string,
  tWordsPhrase: string,
};

class ImportWallet extends React.Component<Props, State> {
  state = {
    showLoader: false,
    privateKey: '',
    tWordsPhrase: '',
  };

  handleImportSubmit = () => {
    const { importWalletFromTWordsPhrase, importWalletFromPrivateKey } = this.props;

    if (this.state.privateKey) {
      importWalletFromPrivateKey(this.state.privateKey);
    } else if (this.state.tWordsPhrase) {
      importWalletFromTWordsPhrase(this.state.tWordsPhrase);
    }
  };

  render() {
    const { walletState, data: wallet, error } = this.props.wallet;
    const {
      showLoader,
      privateKey,
      tWordsPhrase,
    } = this.state;

    const showError = walletState === WALLET_ERROR && error.code === IMPORT_ERROR
      ? <Text style={styles.errorText}>{error.message}</Text>
      : null;

    if (walletState === IMPORTED) {
      return (
        <View>
          <Text style={styles.textRow}>Public key: {wallet.address}</Text>
        </View>
      );
    }

    if (walletState === IMPORT_SET_PIN) {
      return (
        <View style={styles.container}>
          <PinCode
            onPinEntered={pin => this.props.encryptWithPinCode(pin, wallet)}
            pageHeading="Enter Passcode"
            pageInstructions="Setup your Passcode"
            showForgotButton={false}
          />
          {showError}
        </View>
      );
    }

    if (walletState === ENCRYPTING) {
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

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Wallet import</Text>
        <View>
          <Text style={styles.textRow}>Private key</Text>
          <TextInput
            style={styles.input}
            value={privateKey}
            onChangeText={text => this.setState({ privateKey: text })}
          />

          <Text style={styles.textRow}>- OR -</Text>

          <Text style={styles.textRow}>12 words phrase</Text>
          <TextInput
            style={styles.input}
            value={tWordsPhrase}
            height={80}
            multiline
            onChangeText={text => this.setState({ tWordsPhrase: text })}
          />

          <TouchableHighlight
            style={styles.submitButton}
            underlayColor="white"
            onPress={this.handleImportSubmit}
          >
            <Text style={styles.buttonText}>Import</Text>
          </TouchableHighlight>
        </View>

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

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  importWalletFromTWordsPhrase: (tWordsPhrase) => {
    dispatch(importWalletFromTWordsPhraseAction(tWordsPhrase));
  },
  importWalletFromPrivateKey: (privateKey) => {
    dispatch(importWalletFromPrivateKeyAction(privateKey));
  },
  encryptWithPinCode: (pin, wallet) => {
    dispatch(setPinForImportedWalletAction(pin, wallet));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ImportWallet);
