// @flow
import * as React from 'react';
import { Container, Wrapper, Footer } from 'components/Layout';
import type { NavigationScreenProp } from 'react-navigation';
import Header from 'components/Header';
import { Paragraph, TextLink } from 'components/Typography';
import Button from 'components/Button';
import MultiButtonWrapper from 'components/MultiButtonWrapper';
import Checkbox from 'components/Checkbox';
import { connect } from 'react-redux';
import { registerWalletAction } from 'actions/onboardingActions';
import IFrameModal from 'components/Modals/IFrameModal';
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
            text="Pillar does not have access to my private keys."
            onPress={() => this.setState({ userCheck1: !userCheck1 })}
          />

          <Checkbox
            text="The only way to recover my assets is to use the 12-word backup phrase."
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
              disabled={!userCheck1 || !userCheck2 || !userCheck3}
              marginBottom="20px"
            />
            <View style={{
              alignContent: 'center',
              justifyContent: 'center',
              flexDirection: 'row',
            }}
            >
              <TextLink onPress={this.toggleTermsConditionsModal}>Terms & Conditions</TextLink>
              <Paragraph style={{
                marginRight: 4,
                marginLeft: 4,
                marginBottom: 0,
                fontSize: fontSizes.small,
              }}
              >
                and
              </Paragraph>
              <TextLink onPress={this.togglePrivacyPolicyModal}>Privacy Policy</TextLink>
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
