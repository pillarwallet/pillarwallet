// @flow

import * as React from 'react';
import {
  Text,
  View,
} from 'react-native';

import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';

import { generateWalletMnemonicAction } from 'actions/walletActions';
import DefaultButton from 'components/Buttons/DefaultButton';
// import { BACKUP_PHRASE_VALIDATE } from 'constants/navigationConstants';
import styles from './styles';

type Props = {
  wallet: Object,
  navigation: NavigationScreenProp<*>,
};

class BackupPhraseValidate extends React.Component<Props, {}> {
  createListItem(i: number, list: string[]) {
    return (
      <Text style={styles.listItem} key={i + list[i]}>{ list[i] }</Text>
    );
  }

  goToNextScreen = () => {
    // this.props.navigation.navigate(BACKUP_PHRASE_VALIDATE);
  };

  render() {
    const { data: wallet } = this.props.wallet;
    if (!wallet.mnemonic) return null;

    const mnemonicList = wallet.mnemonic.split(' ');
    const wordList = mnemonicList.map((num, i) => this.createListItem(i, mnemonicList));

    return (
      <View style={styles.container}>
        <View style={styles.textContainer}>
          <Text style={styles.header}>Yo!</Text>
          <Text style={styles.paragraph}>
            This is your unique 12-word backup phrase.
            Write down your backup phrase in the exact sequence.
          </Text>
        </View>

        <View style={styles.mnemonicContainer}>
          { wordList }
        </View>

        <View style={styles.confirmContainer}>
          <Text style={styles.paragraphSmall}>Did your write down your backup phrase?</Text>
          <DefaultButton title="I've Written it Down" onPress={this.goToNextScreen} />
        </View>
      </View>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  generateWalletMnemonic: () => {
    dispatch(generateWalletMnemonicAction());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(BackupPhraseValidate);
