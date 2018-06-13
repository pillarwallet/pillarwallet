// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import {
  importWalletFromTWordsPhraseAction,
  importWalletFromPrivateKeyAction,
} from 'actions/walletActions';
import {
  WALLET_ERROR,
  IMPORT_ERROR,
} from 'constants/walletConstants';
import HeaderLink from 'components/HeaderLink';
import { Container, ScrollWrapper } from 'components/Layout';
import { Paragraph } from 'components/Typography';
import Title from 'components/Title';
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
  errorType: string,
};

class ImportWallet extends React.Component<Props, State> {
  state = {
    privateKey: '',
    tWordsPhrase: '',
    errorMessage: '',
    errorType: '',
  };

  constructor(props: Props) {
    super(props);
    props.navigation.setParams({
      handleImportSubmit: this.handleImportSubmit,
    });
  }

  static navigationOptions = ({ navigation }) => ({
    headerRight: (
      <HeaderLink
        onPress={() => navigation.state.params.handleImportSubmit()}
      >
      Import
      </HeaderLink>
    ),
  });

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    const { walletState, error } = nextProps.wallet;

    const showError = walletState === WALLET_ERROR && error.code === IMPORT_ERROR;
    const errorMessage = showError && error.message;
    const errorType = showError ? error.type : '';
    // alert(errorMessage);

    return {
      ...prevState,
      errorMessage,
      errorType,
    };
  }

  handleImportSubmit = () => {
    const { importWalletFromTWordsPhrase, importWalletFromPrivateKey } = this.props;
    if (this.state.privateKey) {
      importWalletFromPrivateKey(this.state.privateKey);
    } else if (this.state.tWordsPhrase) {
      importWalletFromTWordsPhrase(this.state.tWordsPhrase);
    } else {
      this.setState({ errorMessage: '' });
    }
  };

  getError = (errorType: string) => {
    if (errorType === this.state.errorType) {
      return this.state.errorMessage;
    }
    return '';
  }

  render() {
    const { privateKey, tWordsPhrase } = this.state;
    const errorMessageTWordsPhrase = this.state.errorType === 'tWordsPhrase' ? this.state.errorMessage : '';
    const errorMessagePrivateKey = this.state.errorType === 'privateKey' ? this.state.errorMessage : '';
    return (
      <Container>
        <ScrollWrapper padding>
          <Title title="restore wallet" />
          <Paragraph>
              Restore your ERC-20 compatible Ethereum Wallet using your 12 word backup phrase or private key.
          </Paragraph>
          <TextInput
            label="Enter your 12 word backup phrase."
            inputProps={{
              onChange: (text) => this.setState({ tWordsPhrase: text }),
              value: tWordsPhrase,
              multiline: true,
            }}
            errorMessage={errorMessageTWordsPhrase}
          />
          <Paragraph>Don&#39;t have your backup phrase? Use your private key instead.</Paragraph>
          <TextInput
            label="Use your Private Key"
            inputProps={{
              onChange: (text) => this.setState({ privateKey: text }),
              value: privateKey,
            }}
            errorMessage={errorMessagePrivateKey}
          />
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
