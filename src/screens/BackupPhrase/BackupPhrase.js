// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { Paragraph } from 'components/Typography';
import Header from 'components/Header';
import { Container, Wrapper } from 'components/Layout';
import MnemonicPhrase from 'components/MnemonicPhrase';
import Button from 'components/Button';
import { generateWalletMnemonicAction } from 'actions/walletActions';
import { BACKUP_PHRASE_VALIDATE } from 'constants/navigationConstants';

type Props = {
  wallet: Object,
  navigation: NavigationScreenProp<*>,
  generateWalletMnemonic: () => Function,
};

class BackupPhrase extends React.Component<Props, {}> {
  componentDidMount() {
    this.props.generateWalletMnemonic();
  }

  render() {
    const { onboarding: wallet } = this.props.wallet;
    if (!wallet.mnemonic) return null;

    return (
      <Container>
        <Header title="backup phrase" onBack={() => this.props.navigation.goBack(null)} index={3} />
        <Wrapper regularPadding>
          <Paragraph>Write down all 12 words in the order shown.</Paragraph>
          <Paragraph light>
            Don’t take a screenshot; write them down carefully, make a few copies, and put them in different places.
          </Paragraph>
          <MnemonicPhrase phrase={wallet.mnemonic.original} />
          <Button onPress={() => this.props.navigation.navigate(BACKUP_PHRASE_VALIDATE)} title="Next" />
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  generateWalletMnemonic: () => {
    dispatch(generateWalletMnemonicAction());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(BackupPhrase);
