// @flow
import * as React from 'react';
import { Container, Wrapper, Footer } from 'components/Layout';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native/index';
import Header from 'components/Header';
import { Paragraph, TextLink, BaseText } from 'components/Typography';
import Button from 'components/Button';
import MultiButtonWrapper from 'components/MultiButtonWrapper';
import Checkbox from 'components/Checkbox';
import { connect } from 'react-redux';
import { registerWalletAction } from 'actions/onboardingActions';
import IFrameModal from 'components/Modals/IFrameModal';
import { fontSizes, fontTrackings } from 'utils/variables';
import SlideModal from 'components/Modals/SlideModal';
import ButtonText from 'components/ButtonText';
import { BACKUP_PHRASE } from 'constants/navigationConstants';

type Props = {
  generateEncryptedWallet: () => Function,
  navigation: NavigationScreenProp<*>,
  onboarding: Object,
};

type State = {
  userCheck1: boolean,
  userCheck2: boolean,
  userCheck3: boolean,
  visibleModal: any,
  scrollOffset?: any,
};

const CheckboxText = styled(BaseText)`
  font-size: ${fontSizes.small}px;
  margin-top: 2px;
  letter-spacing: ${fontTrackings.small}px;
  line-height: 20px;
`;

const ModalInnerWrapper = styled.ScrollView`
  padding: 10px 16px 60px;
`;

const PRIVATE_KEY_MODAL = 'PRIVATE_KEY_MODAL';
const BACKUP_PHRASE_MODAL = 'BACKUP_PHRASE_MODAL';
const TERMS_OF_USE_MODAL = 'TERMS_OF_USE_MODAL';

class LegalTerms extends React.Component<Props, State> {
  state = {
    userCheck1: false,
    userCheck2: false,
    userCheck3: false,
    visibleModal: null,
    scrollOffset: null,
  };

  handleConfirm = () => {
    this.props.generateEncryptedWallet();
  };

  toggleCheckbox = (field: string) => {
    const { userCheck1, userCheck2, userCheck3 } = this.state;
    if (field === 'userCheck1') {
      this.setState({
        userCheck1: !userCheck1,
      });
    }
    if (field === 'userCheck2') {
      this.setState({
        userCheck2: !userCheck2,
      });
    }
    if (field === 'userCheck3') {
      this.setState({
        userCheck3: !userCheck3,
      });
    }
  };

  closeModals = () => {
    this.setState({ visibleModal: null });
  };

  backupWallet = () => {
    const { navigation } = this.props;
    navigation.navigate(BACKUP_PHRASE);
  }

  handleOnScroll = event => {
    this.setState({
      scrollOffset: event.nativeEvent.contentOffset.y,
    });
  };

  render() {
    const {
      userCheck1,
      userCheck2,
      userCheck3,
      visibleModal,
      scrollOffset,
    } = this.state;

    const { onboarding } = this.props;
    const userCannotProceed = !(userCheck1 && userCheck2 && userCheck3);

    return (
      <Container>
        <Header title="almost there" onBack={() => this.props.navigation.goBack(null)} />
        <Wrapper regularPadding>
          <Paragraph light small style={{ marginTop: 10, marginBottom: 50 }}>
            With great power comes great responsibility. Make sure you are aware of the following.
          </Paragraph>
          <Checkbox
            onPress={() => this.toggleCheckbox('userCheck1')}
          >
            <CheckboxText>
              {'I’m happy to know that Pillar does not have access to my '}
              <TextLink onPress={() => { this.setState({ visibleModal: PRIVATE_KEY_MODAL }); }}>
                private key
              </TextLink>
            </CheckboxText>
          </Checkbox>

          <Checkbox
            onPress={() => this.toggleCheckbox('userCheck2')}
          >
            <CheckboxText>
              {'The only way to recover assets is to use the '}
              <TextLink
                onPress={() => { this.setState({ visibleModal: BACKUP_PHRASE_MODAL }); }}
              >
                 backup phrase
              </TextLink>
            </CheckboxText>
          </Checkbox>

          <Checkbox
            onPress={() => this.toggleCheckbox('userCheck3')}
          >
            <CheckboxText>
              {'I have read, understand, and agree to the '}
              <TextLink
                onPress={() => { this.setState({ visibleModal: TERMS_OF_USE_MODAL }); }}
              >
                 Terms of Use
              </TextLink>
            </CheckboxText>
          </Checkbox>

        </Wrapper>
        <Footer>
          <MultiButtonWrapper>
            <Button
              block
              title="Finish"
              onPress={this.handleConfirm}
              disabled={userCannotProceed}
            />
            {!onboarding.importedWallet &&
            <ButtonText
              buttonText="Backup wallet"
              onPress={this.backupWallet}
              fontSize={fontSizes.medium}
              wrapperStyle={{ marginTop: 20 }}
            />}
          </MultiButtonWrapper>
        </Footer>

        <IFrameModal
          isVisible={visibleModal === TERMS_OF_USE_MODAL}
          modalHide={this.closeModals}
          uri="https://pillarproject.io/en/legal/terms-of-use/"
        />

        <SlideModal
          title="private key"
          isVisible={visibleModal === PRIVATE_KEY_MODAL}
          onModalHide={this.closeModals}
          fullScreen
          showHeader
          scrollOffset={scrollOffset}
        >
          <ModalInnerWrapper
            onScroll={this.handleOnScroll}
          >
            <Paragraph small>
              When you create an account with Pillar, you are generating a cryptographic set of numbers: your private
              key and your public key (address).
            </Paragraph>
            <Paragraph small>
              Your public address can/should be shared and is how you transact with other individuals on the blockchain.
            </Paragraph>
            <Paragraph small>
              Your private key should remain private and secure as it provides complete control over your wallet and all
              the funds stored within.
            </Paragraph>
            <Paragraph small>
              The handling of your private key(s) happens entirely on your device and is stored locally.
              Pillar does not have access to it. We never transmit, receive or store your private key or pin code.
            </Paragraph>
            <Paragraph small>
              In the Pillar wallet, your private key is represented by your backup phrase.
              If you lose your backup phrase, it is gone forever.
            </Paragraph>
            <Paragraph small>
              Do not lose it or share it with anyone.
            </Paragraph>
          </ModalInnerWrapper>
        </SlideModal>

        <SlideModal
          title="Backup phrase"
          isVisible={visibleModal === BACKUP_PHRASE_MODAL}
          onModalHide={this.closeModals}
          fullScreen
          showHeader
        >
          <ModalInnerWrapper
            onScroll={this.handleOnScroll}
          >
            <Paragraph small>
              Your wallet private key is represented and secured by a 12 word backup phrase.
            </Paragraph>
            <Paragraph small>
              It is stored locally on your device. Pillar does not have access to it.
            </Paragraph>
            <Paragraph small>
              Keep your backup phrase safe. If you lose it, Pillar will not be able to recover it for you.
            </Paragraph>
            <Paragraph small>
              Do NOT just store it on your computer. Print it out on a piece of paper or save it to a USB drive.
              Consider the risk of flood or fire. Multiple secure copies are recommended.
            </Paragraph>
            <Paragraph small>
              Do not store your backup phrase in Dropbox, Google Drive, or other cloud storage.
              If that account is compromised, your funds can be stolen.
            </Paragraph>
          </ModalInnerWrapper>
        </SlideModal>
      </Container>
    );
  }
}


const mapStateToProps = ({ wallet: { onboarding } }) => ({ onboarding });

const mapDispatchToProps = (dispatch: Function) => ({
  generateEncryptedWallet: () => {
    dispatch(registerWalletAction());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(LegalTerms);
