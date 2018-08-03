// @flow
import * as React from 'react';
import { Container, Wrapper, Footer } from 'components/Layout';
import type { NavigationScreenProp } from 'react-navigation';
import Header from 'components/Header';
import { Paragraph } from 'components/Typography';
import Button from 'components/Button';
import MultiButtonWrapper from 'components/MultiButtonWrapper';
import Checkbox from 'components/Checkbox';
import { connect } from 'react-redux';
import { registerWalletAction } from 'actions/onboardingActions';
import IFrameModal from 'components/Modals/IFrameModal';
import ButtonText from 'components/ButtonText';
import { View } from 'react-native';
import { fontSizes } from 'utils/variables';


type Props = {
  generateEncryptedWallet: () => Function,
  navigation: NavigationScreenProp<*>,
};

type State = {
  userCheck1: boolean,
  userCheck2: boolean,
  userCheck3: boolean,
  showTermsConditionsModal: boolean,
  showPrivacyPolicyModal: boolean,
};

class LegalTerms extends React.Component<Props, State> {
  state = {
    userCheck1: false,
    userCheck2: false,
    userCheck3: false,
    showTermsConditionsModal: false,
    showPrivacyPolicyModal: false,
  };

  handleConfirm = () => {
    this.props.generateEncryptedWallet();
  };

  toggleTermsConditionsModal = () => {
    this.setState({ showTermsConditionsModal: !this.state.showTermsConditionsModal });
  };

  togglePrivacyPolicyModal = () => {
    this.setState({ showPrivacyPolicyModal: !this.state.showPrivacyPolicyModal });
  };

  render() {
    const {
      userCheck1,
      userCheck2,
      userCheck3,
      showTermsConditionsModal,
      showPrivacyPolicyModal,
    } = this.state;

    const userCanAcceptCheck3 = !(userCheck1 && userCheck2);

    return (
      <Container>
        <Header title="review" onBack={() => this.props.navigation.goBack(null)} />
        <Wrapper regularPadding>
          <Paragraph style={{ marginBottom: 20 }}>By using the Pillar Wallet I understand that:</Paragraph>
          <Checkbox
            text="The assets I store on this wallet are safe on their respective blockchains and that this wallet holds
              the private key to those assets. Pillar does not have access to my private keys."
            onPress={() => this.setState({ userCheck1: !userCheck1 })}
          />

          <Checkbox
            text="If I delete or move this app to another phone,
            the only way to recover my assets is to use the 12-word backup phrase."
            onPress={() => this.setState({ userCheck2: !userCheck2 })}
          />

        </Wrapper>
        <Footer>

          <Checkbox
            text="I have read, understand, and agree to the Terms of Use."
            onPress={() => this.setState({ userCheck3: !userCheck3 })}
            disabled={userCanAcceptCheck3}
          />

          <MultiButtonWrapper>
            <Button
              block
              title="Confirm and Finish"
              onPress={this.handleConfirm}
              disabled={!userCheck3}
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
              <Paragraph style={{
                marginRight: 4,
                marginLeft: 4,
                marginBottom: 0,
                fontSize: fontSizes.extraSmall,
              }}
              >
                and
              </Paragraph>
              <ButtonText buttonText="Privacy Policy" onPress={this.togglePrivacyPolicyModal} />
            </View>
          </MultiButtonWrapper>
        </Footer>

        <IFrameModal
          isVisible={showTermsConditionsModal}
          modalHide={this.toggleTermsConditionsModal}
          uri="https://pillarproject.io/en/legal/terms-of-use/"
        />

        <IFrameModal
          isVisible={showPrivacyPolicyModal}
          modalHide={this.togglePrivacyPolicyModal}
          uri="https://pillarproject.io/en/legal/privacy/"
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
