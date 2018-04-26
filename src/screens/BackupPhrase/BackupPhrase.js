// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';

import { Text } from 'react-native';
import { Container } from 'components/Layout';
import Wrapper from 'components/Wrapper';
import Footer from 'components/Footer';
import { Title } from 'components/Typography';
import Button from 'components/Button';
import HelpText from 'components/HelpText';
import MneumonicPhrase from 'components/MneumonicPhrase';
import MneumonicPhraseItem from 'components/MneumonicPhraseItem';

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
    const mnemonicList = wallet.mnemonic.original.split(' ');
    const wordList = mnemonicList.map(word => <MneumonicPhraseItem key={word}>{word}</MneumonicPhraseItem>);

    return (
      <Container>
        <Wrapper padding>
          <Title>Write Down Your Backup Phrase</Title>
          <Text style={{ color: 'grey' }}>
            This is your unique 12-word backup phrase.
            Write down your backup phrase in the exact sequence.
          </Text>
          <MneumonicPhrase>
            { wordList }
          </MneumonicPhrase>
          <Button title="Regenerate" small onPress={this.props.generateWalletMnemonic} width="100%" />
        </Wrapper>
        <Footer padding>
          <HelpText>Did your write down your backup phrase?</HelpText>
          <Button title="I've Written it Down" onPress={this.goToNextScreen} />
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
