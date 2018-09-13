// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp, NavigationEventSubscription } from 'react-navigation';
import { Paragraph } from 'components/Typography';
import Header from 'components/Header';
import { Container, Wrapper, Footer } from 'components/Layout';
import MnemonicPhrase from 'components/MnemonicPhrase';
import Button from 'components/Button';
import { generateWalletMnemonicAction, generateWordsValidationAction } from 'actions/walletActions';
import { BACKUP_PHRASE_VALIDATE } from 'constants/navigationConstants';

type Props = {
  wallet: Object,
  navigation: NavigationScreenProp<*>,
  generateWalletMnemonic: () => Function,
  generateWordsValidation: (mnemonicPhrase: string) => Function,
};

class BackupPhrase extends React.Component<Props, {}> {
  _didFocus: NavigationEventSubscription;

  componentDidMount() {
    this.props.generateWalletMnemonic();
    this._didFocus = this.props.navigation.addListener(
      'didFocus',
      () => {
        this.props.generateWordsValidation(this.props.wallet.onboarding.mnemonic.original);
      },
    );
  }

  componentWillUnmount() {
    this._didFocus.remove();
  }

  render() {
    const { onboarding: wallet } = this.props.wallet;
    if (!wallet.mnemonic) return null;

    return (
      <Container>
        <Header title="backup phrase" onBack={() => this.props.navigation.goBack(null)} />
        <Wrapper regularPadding>
          <Paragraph>Write down your 12 word backup phrase in the correct order.</Paragraph>
          <MnemonicPhrase phrase={wallet.mnemonic.original} />
        </Wrapper>
        <Footer>
          <Button small flexRight onPress={() => this.props.navigation.navigate(BACKUP_PHRASE_VALIDATE)} title="Next" />
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  generateWalletMnemonic: () => {
    dispatch(generateWalletMnemonicAction());
  },
  generateWordsValidation: (mnemonicPhrase: string) => {
    dispatch(generateWordsValidationAction(mnemonicPhrase));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(BackupPhrase);
