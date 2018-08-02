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
};

let listener = null;

class ImportWallet extends React.Component<Props, State> {
  state = {
    privateKey: '',
    tWordsPhrase: '',
    errorMessage: '',
    errorField: '',
  };

  constructor(props: Props) {
    super(props);
    props.navigation.setParams({
      handleImportSubmit: this.handleImportSubmit,
    });
  }

  phisicalBackAction = () => {
    this.handleBackAction();
    return true;
  }

  componentDidMount() {
    const { navigation } = this.props;
    const navigateTo = navigation.getParam('navigateTo', null);
    if (Platform.OS === 'android' && listener == null && navigateTo) {
      BackHandler.addEventListener('hardwareBackPress', this.phisicalBackAction);
    }
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.phisicalBackAction);
    listener = null;
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
  }

  render() {
    const { privateKey, tWordsPhrase } = this.state;
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
          <Button title="Import" onPress={() => this.props.navigation.state.params.handleImportSubmit()} />
        </ScrollWrapper>
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
