// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import { Container, ScrollWrapper, Footer } from 'components/Layout';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native/index';
import Header from 'components/Header';
import { Paragraph, TextLink, BaseText } from 'components/Typography';
import Button from 'components/Button';
import MultiButtonWrapper from 'components/MultiButtonWrapper';
import Checkbox from 'components/Checkbox';
import { connect } from 'react-redux';
import { registerWalletAction } from 'actions/onboardingActions';
import HTMLContentModal from 'components/Modals/HTMLContentModal';
import { fontSizes, fontTrackings } from 'utils/variables';
import SlideModal from 'components/Modals/SlideModal';
import ButtonText from 'components/ButtonText';
import { BACKUP_PHRASE } from 'constants/navigationConstants';
import PrivateKeyModal from './PrivateKeyModal';
import BackupPhraseModal from './BackupPhraseModal';

type Props = {
  generateEncryptedWallet: () => Function,
  navigation: NavigationScreenProp<*>,
  onboarding: Object,
  backupStatus: Object,
};

type State = {
  userCheck1: boolean,
  userCheck2: boolean,
  userCheck3: boolean,
  userCheck4: boolean,
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
const PRIVACY_POLICY_MODAL = 'PRIVACY_POLICY_MODAL';

class LegalTerms extends React.Component<Props, State> {
  state = {
    userCheck1: false,
    userCheck2: false,
    userCheck3: false,
    userCheck4: false,
    visibleModal: null,
    scrollOffset: null,
  };

  handleConfirm = () => {
    this.props.generateEncryptedWallet();
  };

  toggleCheckbox = (field: string) => {
    const {
      userCheck1,
      userCheck2,
      userCheck3,
      userCheck4,
    } = this.state;

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
    if (field === 'userCheck4') {
      this.setState({
        userCheck4: !userCheck4,
      });
    }
  };

  closeModals = () => {
    this.setState({ visibleModal: null });
  };

  backupWallet = () => {
    const { navigation } = this.props;
    navigation.navigate(BACKUP_PHRASE);
  };

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
      userCheck4,
      visibleModal,
      scrollOffset,
    } = this.state;

    const { backupStatus } = this.props;
    const { isBackedUp, isImported } = backupStatus;
    const userCannotProceed = !(userCheck1 && userCheck2 && userCheck3 && userCheck4);
    const isWalletBackedUp = isImported || isBackedUp;

    return (
      <Container>
        <Header title="almost there" onBack={() => this.props.navigation.goBack(null)} />
        <ScrollWrapper regularPadding>
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

          <Checkbox
            onPress={() => this.toggleCheckbox('userCheck4')}
          >
            <CheckboxText>
              {'I have read, understand, and agree to the '}
              <TextLink
                onPress={() => { this.setState({ visibleModal: PRIVACY_POLICY_MODAL }); }}
              >
                Privacy Policy
              </TextLink>
            </CheckboxText>
          </Checkbox>

        </ScrollWrapper>
        <Footer>
          <MultiButtonWrapper>
            <Button
              block
              title="Finish"
              onPress={this.handleConfirm}
              disabled={userCannotProceed}
            />
            {!isWalletBackedUp &&
            <ButtonText
              buttonText="Backup wallet"
              onPress={this.backupWallet}
              fontSize={fontSizes.medium}
              wrapperStyle={{ marginTop: 20 }}
            />}
          </MultiButtonWrapper>
        </Footer>

        <HTMLContentModal
          isVisible={visibleModal === TERMS_OF_USE_MODAL}
          modalHide={this.closeModals}
          htmlEndpoint="terms_of_service"
        />

        <HTMLContentModal
          isVisible={visibleModal === PRIVACY_POLICY_MODAL}
          modalHide={this.closeModals}
          htmlEndpoint="privacy_policy"
        />

        <SlideModal
          title="private key"
          isVisible={visibleModal === PRIVATE_KEY_MODAL}
          onModalHide={this.closeModals}
          fullScreen
          showHeader
          scrollOffset={scrollOffset}
        >
          <ModalInnerWrapper onScroll={this.handleOnScroll}>
            <PrivateKeyModal />
          </ModalInnerWrapper>
        </SlideModal>

        <SlideModal
          title="backup phrase"
          isVisible={visibleModal === BACKUP_PHRASE_MODAL}
          onModalHide={this.closeModals}
          fullScreen
          showHeader
        >
          <ModalInnerWrapper onScroll={this.handleOnScroll}>
            <BackupPhraseModal />
          </ModalInnerWrapper>
        </SlideModal>
      </Container>
    );
  }
}


const mapStateToProps = ({ wallet: { onboarding, backupStatus } }) => ({ onboarding, backupStatus });

const mapDispatchToProps = (dispatch: Function) => ({
  generateEncryptedWallet: () => {
    dispatch(registerWalletAction());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(LegalTerms);
