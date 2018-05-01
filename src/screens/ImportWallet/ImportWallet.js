// @flow
import * as React from 'react';
import { Text } from 'react-native';
import { connect } from 'react-redux';

import {
  importWalletFromTWordsPhraseAction,
  importWalletFromPrivateKeyAction,
} from 'actions/walletActions';

import {
  WALLET_ERROR,
  IMPORT_ERROR,
} from 'constants/walletConstants';

import { Container } from 'components/Layout';
import Wrapper from 'components/Wrapper';
import Footer from 'components/Footer';
import { Title, Label } from 'components/Typography';
import Button from 'components/Button';
import Input from 'components/Input';
import InputGroup from 'components/InputGroup';

type Props = {
  importWalletFromTWordsPhrase: (tWordsPhrase: string) => Function,
  importWalletFromPrivateKey: (privateKey: string) => Function,
  wallet: Object,
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
      this.setState({
        errorMessage: '',
      });
    }
  };

  render() {
    const { privateKey, tWordsPhrase } = this.state;

    return (
      <Container>
        <Wrapper padding>
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
        </Wrapper>
        <Footer padding>
          <Button
            title="Import"
            onPress={this.handleImportSubmit}
          />
        </Footer>

        {this.state.errorMessage && <Text>{this.state.errorMessage}</Text>}
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
