// @flow
import * as React from 'react';
import { Container, Wrapper, Footer } from 'components/Layout';
import Title from 'components/Title';
import { Paragraph } from 'components/Typography';
import Button from 'components/Button';
import MultiButtonWrapper from 'components/MultiButtonWrapper';
import Divider from 'components/Divider';
import Checkbox from 'components/Checkbox';
import CheckboxItem from 'components/CheckboxItem';
import CheckboxText from 'components/CheckboxText';
import { connect } from 'react-redux';
import { registerWalletAction } from 'actions/onboardingActions';
import IFrameModal from 'components/Modals/IFrameModal';
import ButtonText from 'components/ButtonText';
import { View } from 'react-native';


type Props = {
  generateEncryptedWallet: () => Function,
};

type State = {
  termsViewVisible: boolean,
  box01: boolean,
  box02: boolean,
  box03: boolean,
  confirmButtonDisabled: boolean,
  showTermsConditionsModal: boolean,
  showPrivacyPolicyModal: boolean,
};

class LegalTerms extends React.Component<Props, State> {
  state = {
    termsViewVisible: false,
    box01: false,
    box02: false,
    box03: false,
    confirmButtonDisabled: true,
    showTermsConditionsModal: false,
    showPrivacyPolicyModal: false,
  };

  toggleCheckBox = (checkbox: boolean, tag: any) => {
    this.setState((prevState) => {
      let {
        termsViewVisible,
        box01,
        box02,
        box03,
      } = prevState;

      let confirmButtonDisabled = true;

      if (tag === 'box01') box01 = checkbox;
      if (tag === 'box02') box02 = checkbox;
      if (tag === 'box03') box03 = checkbox;

      if (box01 && box02) {
        termsViewVisible = true;
      } else {
        termsViewVisible = false;
        box03 = false;
      }
      if (box03) {
        confirmButtonDisabled = false;
      }

      return {
        ...prevState,
        box01,
        box02,
        box03,
        termsViewVisible,
        confirmButtonDisabled,
      };
    });
  };

  buildCheckBox = (tag: any, state: boolean) => {
    return <Checkbox toggleCheckbox={this.toggleCheckBox} tag={tag} checked={state} />;
  };

  handleConfirm = () => {
    this.props.generateEncryptedWallet();
  };

  toggleTermsConditionsModal = () => {
    this.setState({ showTermsConditionsModal: !this.state.showTermsConditionsModal });
  }

  togglePrivacyPolicyModal = () => {
    this.setState({ showPrivacyPolicyModal: !this.state.showPrivacyPolicyModal });
  };

  render() {
    const {
      termsViewVisible,
      box01,
      box02,
      box03,
      confirmButtonDisabled,
      showTermsConditionsModal,
      showPrivacyPolicyModal,
    } = this.state;

    return (
      <Container>
        <Wrapper regularPadding>
          <Title title="review" />
          <Paragraph style={{ marginBottom: 20 }}>By using the Pillar Wallet you agree that:</Paragraph>
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
        </Wrapper>
        <Footer>
          <CheckboxItem
            marginBottom
            disabled={!termsViewVisible}
          >
            { this.buildCheckBox('box03', box03) }
            <CheckboxText>
              I have read, understand, and agree to the Terms of Use.
            </CheckboxText>
          </CheckboxItem>
          <Divider />
          <MultiButtonWrapper>
            <Button
              block
              title="Confirm and Finish"
              onPress={this.handleConfirm}
              disabled={confirmButtonDisabled}
              marginBottom="20px"
            />
            <View style={{
              flex: 1,
              alignContent: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
            >
              <ButtonText buttonText="Terms of Use" onPress={this.toggleTermsConditionsModal} />
              <Paragraph style={{ marginRight: 4, marginLeft: 4, marginBottom: 0 }}>and</Paragraph>
              <ButtonText buttonText="Privacy Policy" onPress={this.togglePrivacyPolicyModal} />
            </View>
          </MultiButtonWrapper>
        </Footer>

        <IFrameModal
          isVisible={showTermsConditionsModal}
          modalHide={this.toggleTermsConditionsModal}
          uri="https://pillarproject.io/en/legal/terms-of-use"
        />

        <IFrameModal
          isVisible={showPrivacyPolicyModal}
          modalHide={this.togglePrivacyPolicyModal}
          uri="https://pillarproject.io/en/legal/privacy"
        />
      </Container>
    );
  }
}

const mapDispatchToProps = (dispatch: Function) => ({
  generateEncryptedWallet: () => {
    dispatch(registerWalletAction());
  },
});

export default connect(null, mapDispatchToProps)(LegalTerms);
