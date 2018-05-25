// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import { Paragraph } from 'components/Typography';
import Title from 'components/Title';
import { Container, Wrapper, Footer } from 'components/Layout';
import Button from 'components/Button';
import MnemonicPhrase from 'components/MnemonicPhrase';

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

  goToNextScreen = () => {
    this.props.navigation.navigate(BACKUP_PHRASE_VALIDATE);
  };

  render() {
    const { onboarding: wallet } = this.props.wallet;
    if (!wallet.mnemonic) return null;

    return (
      <Container>
        <Wrapper padding>
          <Title title="passphrase" />
          <Paragraph>Carefully write down your 12 word passphrase in the correct order.</Paragraph>
          <Paragraph light>
            Keep it secure as it&#39;s the only way to recover your account in an emergency.
            Don&#39;t email or screenshot it.
          </Paragraph>
          <MnemonicPhrase phrase={wallet.mnemonic.original} />
        </Wrapper>
        <Footer>
          <Button block marginBottom="20px" title="Verify" onPress={this.goToNextScreen} />
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
});

export default connect(mapStateToProps, mapDispatchToProps)(BackupPhrase);
