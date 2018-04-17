// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';

import { Text } from 'react-native';
import Container from 'components/Container';
import Footer from 'components/Footer';
import Title from 'components/Title';
import Button from 'components/Button';
import ButtonHelpText from 'components/ButtonHelpText';
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

  createListItem(i: number, list: string[]) {
    return (
      <MneumonicPhraseItem key={i + list[i]}>{ list[i] }</MneumonicPhraseItem>
    );
  }

  goToNextScreen = () => {
    this.props.navigation.navigate(BACKUP_PHRASE_VALIDATE);
  };

  render() {
    const { data: wallet } = this.props.wallet;
    if (!wallet.mnemonic) return null;

    const mnemonicList = wallet.mnemonic.split(' ');
    const wordList = mnemonicList.map((num, i) => this.createListItem(i, mnemonicList));

    return (
      <Container>
        <Title>Write Down Your Backup Phrase</Title>
        <Text style={{ color: 'grey' }}>
          This is your unique 12-word backup phrase.
          Write down your backup phrase in the exact sequence.
        </Text>

        <MneumonicPhrase>
          { wordList }
        </MneumonicPhrase>

        <Footer>
          <ButtonHelpText>Did your write down your backup phrase?</ButtonHelpText>
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
