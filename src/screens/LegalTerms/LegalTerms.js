// @flow

// PURPOSE: this screen is used to display the 12-word
// backup phrase for the wallet.
import * as React from 'react';
import {
  Animated,
  Button,
  Text,
  View,
} from 'react-native';

import Checkbox from '../../components/Checkbox/Checkbox';
import DefaultButton from '../../components/Buttons/DefaultButton/DefaultButton';

import styles from './styles';

type Checks = any[];

type State = {
  termsViewVisible: boolean,
  checkboxes: Checks,
};

export default class LegalTerms extends React.Component<{}, State> {
  state = {
    termsViewVisible: false,
    checkboxes: [],
  };

  toggleCheckBox = (tag: Checkbox) => {
    this.setState({
      checkboxes: [...this.state.checkboxes, tag],
    }, () => {
      if (this.state.checkboxes.length === 2) {
        this.displayAcceptance();
      }
    });
  }

  displayAcceptance = () => {
    this.setState({
      termsViewVisible: !this.state.termsViewVisible,
    });
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
        </View>

        {termsViewVisible && (
        <Animated.View style={styles.confirmContainer}>

          <View style={styles.checkboxRow}>
            <Checkbox toggleCheckbox={this.toggleCheckBox} tag={3} />
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
        </Animated.View>
        )}


      </View>

    );
  }
}
