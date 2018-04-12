// @flow
import * as React from 'react';
import {
  Text,
  View,
  TextInput,
  TouchableHighlight,
  ActivityIndicator,
} from 'react-native';
import ethers from 'ethers';
import styles from './styles';

type State = {
  showLoader: boolean,
  privateKey: string,
  tWordsPhrase: string,
  importError: string,
  restoredWallet: ?Object
};

export default class ImportWallet extends React.Component<{}, State> {
  state = {
    showLoader: false,
    privateKey: '',
    tWordsPhrase: '',
    importError: '',
    restoredWallet: null,
  };

  handleImportSubmit = () => {
    this.setState({
      importError: '',
      showLoader: true,
    });

    let restoredWallet = null;
    if (this.state.privateKey) {
      restoredWallet = this.handlePrivateKeyImport(this.state.privateKey);
    } else if (this.state.tWordsPhrase) {
      restoredWallet = this.handleTWordsRestore(this.state.tWordsPhrase);
    }

    this.setState({
      restoredWallet,
      showLoader: false,
    });
  };

  handlePrivateKeyImport(privateKey: string) {
    const walletPrivateKey = privateKey.substr(0, 2) === '0x' ? privateKey : `0x${privateKey}`;
    try {
      return new ethers.Wallet(walletPrivateKey);
    } catch (e) {
      this.setState({
        importError: e.toString(),
      });
      return null;
    }
  }

  handleTWordsRestore(tWordsPhrase: string) {
    try {
      return ethers.Wallet.fromMnemonic(tWordsPhrase);
    } catch (e) {
      this.setState({
        importError: e.toString(),
      });
      return null;
    }
  }

  validatePin(pin: string) {
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
      privateKey,
      tWordsPhrase,
      importError,
      restoredWallet,
    } = this.state;

    const showError = (
      importError ? <Text style={styles.errorText}>{importError}</Text> : null
    );

    const enterPinCode = restoredWallet && (
      <View>
        <Text style={styles.textRow}>Public key: {restoredWallet.address}</Text>
      </View>
    );

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Wallet import</Text>
        {enterPinCode}
        {!showLoader && !restoredWallet && (
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
