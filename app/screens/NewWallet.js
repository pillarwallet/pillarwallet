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
import { NavigationActions } from 'react-navigation';
import ethers from 'ethers';
import Pincode from './Pincode';

export default class NewWallet extends React.Component {
  state = {
    mnemonic: '',
    wallet: {},
    walletCreated: false,
    pin: '',
    pinError: '',
    showLoader: false
  };

  handlePinChange = (event) => {
    this.setState({
      pin: event.nativeEvent.text
    });
  };

  handlePinSubmit = (pin) => {
    console.log(pin)
    const validationError = this.validatePin(pin);
    if (validationError) {
      this.setState({
        pinError: validationError
      });
      return;
    }

    const mnemonic = ethers.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));
    const wallet = ethers.Wallet.fromMnemonic(mnemonic);

    const timeout = setTimeout(async () => {
      this.storeEncryptedWallet(await wallet.encrypt(pin));
      clearTimeout(timeout);
    }, 0);

    this.setState({
      pinError: '',
      showLoader: true,
      mnemonic,
      wallet
    });
  };

  validatePin(pin) {
    if (pin.length !== 6) {
      return "Invalid pin's length (should be 6 numbers)";
    } else if(!pin.match(/^\d+$/)) {
      return "Pin could contain numbers only";
    }
    return '';
  }

  async storeEncryptedWallet(encryptedWallet) {
    console.log("encryptedWallet", encryptedWallet);
    await AsyncStorage.setItem("wallet", JSON.stringify(encryptedWallet));

    AsyncStorage.getItem("wallet")
      .then((json) => {
        try {
          console.log('encryptedWallet', json);
          const wallet = JSON.parse(json);
          console.log('encryptedWallet parsed', wallet);
        } catch(e) {
        }
      })
      .catch(() => {
        this.setState({
          loadedEncryptedWallet: false
        });
      });

    this.setState({
      walletCreated: true,
      showLoader: false
    });
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
      showLoader
    } = this.state;

    const showError = (
      pinError ?
        <Text style={styles.errorText}>{pinError}</Text> :
        null
    );

    const walletCreatedComponent = (
      <View style={styles.pinCodeCreatedContainer}>
        <Text style={styles.textRow}>Password: {pin}</Text>
        <Text style={styles.textRow}>Mnemonic: {mnemonic}</Text>
        <Text style={styles.textRow}>Public address: {wallet.address}</Text>
        <Text style={styles.textRow}>Private key: {wallet.privateKey}</Text>

        <TouchableHighlight
          style={styles.submitButton}
          onPress={this.goToLoginPage}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableHighlight>
      </View>
    );

    const enterPinComponent = (
      !showLoader && <Pincode
      pageHeading = "Setup New Pin"
      onPinSubmit = {this.handlePinSubmit}> 
      </Pincode>
      
      // <View style={styles.enterPinContainer}>
      //   <Text style={styles.title}>Enter your pin</Text>
      //   {!showLoader && (
      //     <View>
      //       <TextInput
      //         style={styles.pinInput}
      //         value={pin}
      //         onChange={this.handlePinChange}
      //       />
      //       <TouchableHighlight
      //         style={styles.submitButton}
      //         underlayColor='white'
      //         onPress={this.handlePinSubmit}>
      //         <Text style={styles.buttonText}>Submit</Text>
      //       </TouchableHighlight>
      //     </View>
      //   )}

      //   {showError}

      //   <ActivityIndicator
      //     animating={showLoader}
      //     color='#111'
      //     size='large'
      //   />
      // </View>
    );

    return walletCreated ? walletCreatedComponent : enterPinComponent;
  }
}

const styles = StyleSheet.create({
  pinCodeCreatedContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  enterPinContainer: {
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
  pinInput: {
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
