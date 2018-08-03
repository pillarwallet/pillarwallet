// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import { Platform, BackHandler } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import {
  importWalletFromTWordsPhraseAction,
  importWalletFromPrivateKeyAction,
} from 'actions/walletActions';
import {
  WALLET_ERROR,
  IMPORT_ERROR,
  IMPORT_WALLET_PRIVATE_KEY,
  IMPORT_WALLET_TWORDS_PHRASE,
} from 'constants/walletConstants';
import Button from 'components/Button';
import { Container, ScrollWrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import Header from 'components/Header';
import TextInput from 'components/TextInput';
import QRCodeScanner from 'components/QRCodeScanner';
import { Keyboard, KeyboardAvoidingView as RNKeyboardAvoidingView, Platform } from 'react-native';
import { Permissions } from 'expo';

const PERMISSION_GRANTED = 'GRANTED';

type Props = {
  importWalletFromTWordsPhrase: (tWordsPhrase: string) => Function,
  importWalletFromPrivateKey: (privateKey: string) => Function,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
};

type State = {
  privateKey: string,
  tWordsPhrase: string,
  errorMessage: string,
  errorField: string,
  isScanning: boolean,
};

class ImportWallet extends React.Component<Props, State> {
  state = {
    privateKey: '',
    tWordsPhrase: '',
    errorMessage: '',
    errorField: '',
    isScanning: false,
  };

  constructor(props: Props) {
    super(props);
    props.navigation.setParams({
      handleImportSubmit: this.handleImportSubmit,
    });
  }

  physicalBackAction = () => {
    this.handleBackAction();
    return true;
  };

  componentDidMount() {
    const { navigation } = this.props;
    const navigateTo = navigation.getParam('navigateTo', null);
    if (Platform.OS === 'android' && navigateTo) {
      BackHandler.addEventListener('hardwareBackPress', this.physicalBackAction);
    }
  }

  componentWillUnmount() {
    if (Platform.OS === 'android') {
      BackHandler.removeEventListener('hardwareBackPress', this.physicalBackAction);
    }
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    const { walletState, error } = nextProps.wallet;

    if (walletState === WALLET_ERROR && error.code === IMPORT_ERROR) {
      return {
        ...prevState,
        errorMessage: error.message,
        errorField: error.field,
      };
    }
    return null;
  }

  handleImportSubmit = () => {
    const { importWalletFromTWordsPhrase, importWalletFromPrivateKey } = this.props;
    if (this.state.privateKey) {
      importWalletFromPrivateKey(this.state.privateKey);
    } else if (this.state.tWordsPhrase) {
      importWalletFromTWordsPhrase(this.state.tWordsPhrase);
    } else {
      this.setState({ errorField: '' });
    }
  };

  handleQRScannerOpen = async () => {
    const { status } = await Permissions.askAsync(Permissions.CAMERA);
    this.setState({
      isScanning: status.toUpperCase() === PERMISSION_GRANTED,
    }, () => {
      if (this.state.isScanning) {
        Keyboard.dismiss();
      }
    });
  };

  handleQRScannerClose = () => {
    this.setState({
      isScanning: false,
    });
  };

  handleQRRead = (address: string) => {
    this.setState({ privateKey: { ...this.state.privateKey, address }, isScanning: false }, () => {
      // this.navigateToNextScreen(address);
    });
  };

  getError = (errorField: string) => {
    if (errorField === this.state.errorField) {
      return this.state.errorMessage;
    }
    return '';
  };

  handleBackAction = () => {
    const { navigation } = this.props;
    const navigateTo = navigation.getParam('navigateTo', null);
    if (navigateTo) {
      navigation.navigate(navigateTo);
    } else {
      navigation.goBack(null);
    }
  };

  render() {
    const { privateKey, tWordsPhrase, isScanning } = this.state;
    const errorMessageTWordsPhrase = this.getError(IMPORT_WALLET_TWORDS_PHRASE);
    const errorMessagePrivateKey = this.getError(IMPORT_WALLET_PRIVATE_KEY);

    return (
      <Container>
        <Header title="restore wallet" onBack={this.handleBackAction} />
        <ScrollWrapper regularPadding>
          <Paragraph>
              Restore your ERC-20 compatible Ethereum Wallet using your 12 word backup phrase or private key.
          </Paragraph>
          <TextInput
            label="Enter your 12 word backup phrase."
            inputProps={{
              onChange: (value) => this.setState({ tWordsPhrase: value }),
              value: tWordsPhrase,
              multiline: true,
            }}
            errorMessage={errorMessageTWordsPhrase}
            underlineColorAndroid="transparent"
          />
          <Paragraph>Don&#39;t have your backup phrase? Use your private key instead.</Paragraph>
          <TextInput
            label="Use your Private Key"
            inputProps={{
              onChange: (value) => this.setState({ privateKey: value }),
              value: privateKey,
            }}
            errorMessage={errorMessagePrivateKey}
            underlineColorAndroid="transparent"
          />
          <Button onPress={this.handleQRScannerOpen}/>
          <Button title="Import" onPress={() => this.props.navigation.state.params.handleImportSubmit()} />
        </ScrollWrapper>
        <QRCodeScanner
            isActive={isScanning}
            onDismiss={this.handleQRScannerClose}
            onRead={this.handleQRRead}
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
});

export default connect(mapStateToProps, mapDispatchToProps)(ImportWallet);
