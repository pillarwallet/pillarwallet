// @flow
import * as React from 'react';
import {
  Text,
  View,
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

import Container from 'components/Container';
import Footer from 'components/Footer';
import Title from 'components/Title';
import Button from 'components/Button';
import Input from 'components/Input';
import InputGroup from 'components/InputGroup';
import Label from 'components/Label';
import PinCode from 'components/PinCode';

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
      ? <Text>{error.message}</Text>
      : null;

    if (walletState === IMPORTED) {
      return (
        <View>
          <Text>Public key: {wallet.address}</Text>
        </View>
      );
    }

    if (walletState === IMPORT_SET_PIN) {
      return (
        <Container>
          <Title>Enter Passcode</Title>
          <PinCode
            onPinEntered={pin => this.props.encryptWithPinCode(pin, wallet)}
            pageInstructions="Setup your Passcode"
            showForgotButton={false}
          />
          {showError}
        </Container>
      );
    }

    if (walletState === ENCRYPTING) {
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

    return (
      <Container>
        <Title>Wallet import</Title>
        <InputGroup>
          <Label>Private key</Label>
          <Input
            value={privateKey}
            onChangeText={text => this.setState({ privateKey: text })}
          />

          <Label>12 words phrase</Label>
          <Input
            value={tWordsPhrase}
            height={80}
            multiline
            onChangeText={text => this.setState({ tWordsPhrase: text })}
          />
        </InputGroup>
        <Footer>
          <Button
            title="Import"
            onPress={this.handleImportSubmit}
          />
        </Footer>

        {showError}

        <ActivityIndicator
          animating={showLoader}
          color="#111"
          size="large"
        />
      </Container>
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
