// @flow

// PURPOSE: this screen is used to display the 12-word
// backup phrase for the wallet.
import * as React from 'react';
import {
  Button,
  Linking,
  Text,
  View,
} from 'react-native';

import Checkbox from '../../components/Checkbox/Checkbox';
import DefaultButton from '../../components/Buttons/DefaultButton/DefaultButton';

import styles from './styles';

type State = {
  termsViewVisible: boolean,
  box01: boolean,
  box02: boolean,
  box03: boolean,
};

export default class LegalTerms extends React.Component<{}, State> {
  state = {
    termsViewVisible: false,
    box01: false,
    box02: false,
    box03: false,
  };

  toggleCheckBox = (checkbox: boolean, tag: any) => {
    if (tag === 'checkAll' && checkbox) {
      this.setState({
        box01: true,
        box02: true,
        box03: true,
      });
      return;
    }
    this.setState({
      [tag]: checkbox,
    }, () => {
      if (this.state.box01 === true && this.state.box02 === true) {
        this.setState({
          termsViewVisible: true,

        });
      } else {
        this.setState({
          termsViewVisible: false,
          box03: false,
        });
      }

      if (this.state.box03 === true) {
        // TODO: Need to set NEXT BUTTON FROM DISABLED to ENABLED
      }
    });
  }

  buildCheckBox = (tag: any, state: boolean) => {
    return <Checkbox toggleCheckbox={this.toggleCheckBox} tag={tag} checked={state} />;
  }

  handleConfirm = () => {
    // TODO: Send to next screen
  }

  openURLTermsOfUse = () => {
    Linking.openURL('https://pillarproject.io/en/terms-of-use/');
  }

  openURLPrivacyPolicy = () => {
    Linking.openURL('https://pillarproject.io');
  }

  render() {
    const {
      termsViewVisible,
      box01,
      box02,
      box03,
    } = this.state;

    return (
      <View style={styles.container}>

        <View style={{ justifyContent: 'flex-start', flex: 1 }}>

          <View style={styles.instructionsContainer}>
            <Text style={styles.header2}>Let&#39;s Review</Text>
            <Text style={styles.paragraphSmall}>By using the Pillar Wallet you agree that:</Text>
          </View>

          <View style={styles.checkboxRow}>
            { this.buildCheckBox('box01', box01) }
            <Text style={[styles.paragraph, { marginLeft: 10 }]}>
          I understand that my funds are held securely on this device, not by a company.
            </Text>
          </View>

          <View style={styles.checkboxRow}>
            { this.buildCheckBox('box02', box02) }
            <Text style={[styles.paragraph, { marginLeft: 10 }]}>
          I understand that if this app is moved to a new phone or deleted,
          the only way my funds and contacts can be recovered is by using my 12 word backup phrase.
            </Text>
          </View>
        </View>

        {termsViewVisible && (
        <View style={styles.confirmContainer}>

          <View style={styles.checkboxRow}>
            { this.buildCheckBox('box03', box03) }
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
