// @flow
import * as React from 'react';
import { Linking, Text } from 'react-native';

import Container from 'components/Container';
import MultiButtonWrapper from 'components/MultiButtonWrapper';

import Footer from 'components/Footer';
import Title from 'components/Title';
import Button from 'components/Button';
import Divider from 'components/Divider';
import Checkbox from 'components/Checkbox';
import CheckboxItem from 'components/CheckboxItem';
import CheckboxText from 'components/CheckboxText';

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
      <Container>


        <Title>Let&#39;s Review</Title>
        <Text style={{ color: 'grey', marginBottom: 20 }}>By using the Pillar Wallet you agree that:</Text>
        <CheckboxItem marginBottom>
          { this.buildCheckBox('box01', box01) }
          <CheckboxText>
            I understand that my funds are held securely on this device, not by a company.
          </CheckboxText>
        </CheckboxItem>

        <CheckboxItem marginBottom>
          { this.buildCheckBox('box02', box02) }
          <CheckboxText>
            I understand that if this app is moved to a new phone or deleted,
            the only way my funds and contacts can be recovered is by using my 12 word backup phrase.
          </CheckboxText>
        </CheckboxItem>
        {termsViewVisible && (
          <Footer>
            <CheckboxItem marginBottom>
              { this.buildCheckBox('box03', box03) }
              <CheckboxText>
                I have read, understand, and agree to the Terms of Use.
              </CheckboxText>
            </CheckboxItem>
            <Divider />
            <MultiButtonWrapper>
              <Button
                title="Confirm and Finish"
                onPress={this.handleConfirm}
                disabled={termsViewVisible}
                small
                marginBottom
              />

              <Button
                title="Terms of Use"
                onPress={this.openURLTermsOfUse}
                small
                marginBottom
              />
              <Button
                title="Privacy Policy"
                onPress={this.openURLPrivacyPolicy}
                small
              />
            </MultiButtonWrapper>
          </Footer>
        )}


      </Container>

    );
  }
}
