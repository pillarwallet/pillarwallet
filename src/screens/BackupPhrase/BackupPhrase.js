// @flow
import * as React from 'react';
import { Text } from 'react-native';
import ethers from 'ethers';
import PopModal from 'components/Modals/PopModal';
import Container from 'components/Container';
import Footer from 'components/Footer';
import Title from 'components/Title';
import Button from 'components/Button';
import ButtonHelpText from 'components/ButtonHelpText';
import MneumonicPhrase from 'components/MneumonicPhrase';
import MneumonicPhraseItem from 'components/MneumonicPhraseItem';

const mnemonicPhrase = ethers.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));
const mnemonicList = mnemonicPhrase.split(' ');

type State = {
  isPopupOpen: boolean,
};

export default class BackupPhrase extends React.Component<{}, State> {
  state = {
    isPopupOpen: false,
  };

  createListItem(i: number, list: string[]) {
    return (
      <MneumonicPhraseItem key={i + list[i]}>{ list[i] }</MneumonicPhraseItem>
    );
  }

  popModalHandlePrimary = () => {
    this.handlePopupState();
  };

  handlePopupState = () => {
    this.setState({
      isPopupOpen: !this.state.isPopupOpen,
    });
  };

  render() {
    const { isPopupOpen } = this.state;
    const wordList = Array(mnemonicList.length).fill('')
      .map((num, i) => this.createListItem(i, mnemonicList));

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
          <Button title="I've Written it Down" onPress={this.handlePopupState} />
        </Footer>

        {isPopupOpen && (
          <PopModal
            title="Be Advised"
            message="To protect your assets, write down your backup phrase and passcode on paper."
            actionPrimary="I got it"
            showCloseBtn="true"
            popModalHandlePrimary={this.popModalHandlePrimary}
            popModalHandleDismiss={this.handlePopupState}
          />
        )}
      </Container>
    );
  }
}
