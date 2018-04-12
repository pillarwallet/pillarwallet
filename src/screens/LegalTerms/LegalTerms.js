// @flow

// PURPOSE: this screen is used to display the 12-word
// backup phrase for the wallet.
import * as React from 'react';
import {
  View,
  Text,
} from 'react-native';

import Checkbox from '../../components/Checkbox/Checkbox';
import DefaultButton from '../../components/Buttons/DefaultButton/DefaultButton';

import styles from './styles';

type State = { };

export default class LegalTerms extends React.Component<{}, State> {
  handlePopupState = () => {
  };

  toggleCheckBox = (tag: Checkbox) => {
    console.log(tag);
  }

  handleConfirm = () => {
    console.log('Confirm');
  }

  render() {
    return (
      <View style={styles.container}>
        <View style={styles.instructionsContainer}>
          <Text style={styles.header2}>Let&#39;s Review</Text>
          <Text style={styles.paragraphSmall}>By using the Pillar Wallet you agree that:</Text>
        </View>

        <View style={{ justifyContent: 'center' }}>

          <View style={styles.checkboxRow}>
            <Checkbox toggleCheckbox={this.toggleCheckBox} tag={1} />
            <Text style={[styles.paragraph, { marginLeft: 10 }]}>
          I understand that my funds are held securely on this device, not by a company.
            </Text>
          </View>

          <View style={styles.checkboxRow}>
            <Checkbox toggleCheckbox={this.toggleCheckBox} tag={2} />
            <Text style={[styles.paragraph, { marginLeft: 10 }]}>
          I understand that if this app is moved to a new phone or deleted,
          the only way my funds and contacts can be recovered is by using my 12 word backup phrase.
            </Text>
          </View>

          <View style={styles.confirmContainer}>

            <View style={styles.checkboxRow}>
              <Checkbox toggleCheckbox={this.toggleCheckBox} tag={3} />
              <Text style={[styles.paragraph, { marginLeft: 10 }]}>
            I have read, understand, and agree to the Terms of Use.
              </Text>
            </View>

            <DefaultButton title="Confirm and Finish" onPress={this.handleConfirm} />
          </View>

        </View>
      </View>

    );
  }
}
