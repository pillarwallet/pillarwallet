// @flow
import * as React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableHighlight,
  ActivityIndicator,
  AsyncStorage
} from 'react-native';
import ethers from "ethers";

export default class Import extends React.Component {
  state = {
    showLoader: false,
    privateKey: '',
    tWordsPhrase: '',
    importError: '',
    restoredWallet: null
  };

  handlePrivateKeyChange = (event) => {
    this.setState({
      privateKey: event.nativeEvent.text
    });
  };

  handleTWordsChange = (event) => {
    this.setState({
      tWordsPhrase: event.nativeEvent.text
    });
  };

  handleImportSubmit = () => {
    this.setState({
      importError: '',
      showLoader: true
    });

    let restoredWallet = null;
    if (this.state.privateKey) {
      restoredWallet = this.handlePrivateKeyImport(this.state.privateKey);
    } else if (this.state.tWordsPhrase) {
      restoredWallet = this.handleTWordsRestore(this.state.tWordsPhrase);
    }

    this.setState({
      restoredWallet,
      showLoader: false
    });
  };

  handlePrivateKeyImport(privateKey) {
    privateKey = privateKey.substr(0, 2) === "0x" ? privateKey : "0x" + privateKey;
    try {
      return new ethers.Wallet(privateKey);
    } catch (e) {
      this.setState({
        importError: e.toString()
      });
      return null;
    }
  }

  handleTWordsRestore(tWordsPhrase) {
    try {
      return ethers.Wallet.fromMnemonic(tWordsPhrase);
    } catch (e) {
      this.setState({
        importError: e.toString()
      });
      return null;
    }
  }

  validatePin(pin) {
    if (pin.length !== 6) {
      return "Invalid pin's length (should be 6 numbers)";
    } else if(!pin.match(/^\d+$/)) {
      return "Pin could contain numbers only";
    }
    return '';
  }

  render() {
    const {
      showLoader,
      privateKey,
      tWordsPhrase,
      importError,
      restoredWallet
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
              onChange={this.handlePrivateKeyChange}
            />

            <Text style={styles.textRow}>- OR -</Text>

            <Text style={styles.textRow}>12 words phrase</Text>
            <TextInput
              style={styles.input}
              value={tWordsPhrase}
              height={80}
              multiline={true}
              onChange={this.handleTWordsChange}
            />

            <TouchableHighlight
              style={styles.submitButton}
              underlayColor='white'
              onPress={this.handleImportSubmit}>
              <Text style={styles.buttonText}>Import</Text>
            </TouchableHighlight>
          </View>
        )}

        {showError}

        <ActivityIndicator
          animating={showLoader}
          color='#111'
          size='large'
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    flexDirection: 'column',
    justifyContent: 'center',
    backgroundColor: 'white'
  },
  textRow: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: {
    marginBottom: 20,
    fontSize: 25,
    textAlign: 'center'
  },
  input: {
    height: 50,
    padding: 4,
    marginRight: 5,
    fontSize: 23,
    borderWidth: 1,
    borderColor: 'grey',
    borderRadius: 8
  },
  buttonText: {
    fontSize: 18,
    color: 'white',
    alignSelf: 'center'
  },
  submitButton: {
    height: 45,
    flexDirection: 'row',
    borderColor: '#48BBEC',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    marginTop: 10,
    alignSelf: 'stretch',
    justifyContent: 'center',
    backgroundColor: '#48BBEC'
  },
  errorText: {
    fontSize: 18,
    textAlign: 'center',
    color: 'red'
  }
});