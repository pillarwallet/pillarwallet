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
import { Paragraph, Label } from 'components/Typography';
import Title from 'components/Title';
import Input from 'components/Input';
import ErrorMessage from 'components/ErrorMessage';

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
};

class ImportWallet extends React.Component<Props, State> {
  state = {
    privateKey: '',
    tWordsPhrase: '',
    errorMessage: '',
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

    return {
      ...prevState,
      errorMessage,
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

  render() {
    const { privateKey, tWordsPhrase } = this.state;

    return (
      <Container>
        {this.state.errorMessage && <ErrorMessage>{this.state.errorMessage}</ErrorMessage>}
        <ScrollWrapper padding>
          <Title title="restore wallet" />
          <Paragraph>
              Restore your ERC-20 compatible Ethereum Wallet using your 12 word backup phrase or private key.
          </Paragraph>

          <Label>Enter your 12 word backup phrase.</Label>
          <Input
            value={tWordsPhrase}
            height={80}
            width="100%"
            multiline
            onChangeText={text => this.setState({ tWordsPhrase: text })}
          />
          <Paragraph>Don&#39;t have your backup phrase? Use your private key instead.</Paragraph>
          <Label>Use your Private Key</Label>
          <Input
            value={privateKey}
            onChangeText={text => this.setState({ privateKey: text })}
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
