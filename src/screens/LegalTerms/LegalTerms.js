// @flow

// PURPOSE: this screen is used to display the 12-word
// backup phrase for the wallet.
import * as React from 'react';
import {
  Button,
  Text,
  View,
} from 'react-native';

import Checkbox from '../../components/Checkbox/Checkbox';
import DefaultButton from '../../components/Buttons/DefaultButton/DefaultButton';

import styles from './styles';

type State = {
  termsViewVisible: boolean,
};

export default class LegalTerms extends React.Component<{}, State> {
  state = {
    termsViewVisible: false,
  };

  toggleCheckBox = (checkbox: boolean) => {
    console.log(checkbox);

    // IM DUMB AND HAVE NO IDEA HOW TO CHECK THE CHECKBOX STATES OTHER THAN PUSHING THEM INTO AN ARRAY.
  //   if (checked === true) {
  //     this.setState({
  //       checkboxes: [...this.state.checkboxes, checked],
  //     }, () => {
  //       this.verifyCheckboxes();
  //     });
  //   } else {
  //     this.setState({ checkboxes: this.state.checkboxes.slice(0, -1) }, () => {
  //       this.verifyCheckboxes();
  //     });
  //   }
  // }
  // verifyCheckboxes() {
  //   if (this.state.checkboxes.length >= 2) {
  //     this.setState({
  //       termsViewVisible: true,
  //     });
  //   } else {
  //     this.setState({
  //       termsViewVisible: false,
  //     });
  //   }
  }

  buildCheckBox = (tag: any) => {
    return <Checkbox toggleCheckbox={this.toggleCheckBox} tag={tag} />;
  }

  handleConfirm = () => {
    // TODO: Send to next screen
  }

  openURLTermsOfUse = () => {
    // TODO: Need to Open Terms of Use
  }

  openURLPrivacyPolicy = () => {
    // TODO: Need to Open Terms of Use
  }

  render() {
    const {
      termsViewVisible,
    } = this.state;

    return (
      <View style={styles.container}>

        <View style={{ justifyContent: 'flex-start', flex: 1 }}>

          <View style={styles.instructionsContainer}>
            <Text style={styles.header2}>Let&#39;s Review</Text>
            <Text style={styles.paragraphSmall}>By using the Pillar Wallet you agree that:</Text>
          </View>

          <View style={styles.checkboxRow}>
            { this.buildCheckBox(0) }
            <Text style={[styles.paragraph, { marginLeft: 10 }]}>
          I understand that my funds are held securely on this device, not by a company.
            </Text>
          </View>

          <View style={styles.checkboxRow}>
            { this.buildCheckBox(1) }
            <Text style={[styles.paragraph, { marginLeft: 10 }]}>
          I understand that if this app is moved to a new phone or deleted,
          the only way my funds and contacts can be recovered is by using my 12 word backup phrase.
            </Text>
          </View>
        </View>

        {termsViewVisible && (
        <View style={styles.confirmContainer}>

          <View style={styles.checkboxRow}>
            { this.buildCheckBox(2) }
            <Text style={[styles.paragraph, { marginLeft: 10 }]}>
          I have read, understand, and agree to the Terms of Use.
            </Text>
          </View>

          <DefaultButton title="Confirm and Finish" onPress={this.handleConfirm} disabled={termsViewVisible} />

          <View style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          marginTop: 10,
          marginBottom: 10,
        }}
          >
            <Button title="Terms of Use" onPress={this.openURLTermsOfUse} />
            <Text>and</Text>
            <Button title="Privacy Policy" onPress={this.openURLPrivacyPolicy} />
          </View>
        </View>
        )}


      </View>

    );
  }
}
