// @flow

// PURPOSE: this screen is used to display the 12-word
// backup phrase for the wallet.
import * as React from 'react';
import {
  Text,
  View,
} from 'react-native';

import ethers from 'ethers';
import DefaultButton from 'components/Buttons/DefaultButton';
import PopModal from 'components/Modals/PopModal';
import styles from './styles';

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
      <Text style={styles.listItem} key={i + list[i]}>{ list[i] }</Text>
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
      <View style={styles.container}>
        <View style={styles.textContainer}>
          <Text style={styles.header}>Write Down Your Backup Phrase</Text>
          <Text style={styles.paragraph}>
            This is your unique 12-word backup phrase.
            Write down your backup phrase in the exact sequence.
          </Text>
        </View>

        <View style={styles.mneumonicContainer}>
          { wordList }
        </View>

        <View style={styles.confirmContainer}>
          <Text style={styles.paragraphSmall}>Did your write down your backup phrase?</Text>
          <DefaultButton title="I've Written it Down" onPress={this.handlePopupState} />
        </View>

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
      </View>

    );
  }
}
