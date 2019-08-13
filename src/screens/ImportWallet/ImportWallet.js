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
import { connect } from 'react-redux';
import { Platform, BackHandler, Keyboard, Dimensions } from 'react-native';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import {
  importWalletFromTWordsPhraseAction,
  importWalletFromPrivateKeyAction,
  resetWalletErrorAction,
} from 'actions/walletActions';
import {
  WALLET_ERROR,
  IMPORT_ERROR,
  IMPORT_WALLET_PRIVATE_KEY,
  IMPORT_WALLET_TWORDS_PHRASE,
  TWORDSPHRASE,
  PRIVATEKEY,
} from 'constants/walletConstants';
import { ScrollWrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { Paragraph, BaseText, TextLink } from 'components/Typography';
import TextInput from 'components/TextInput';
import QRCodeScanner from 'components/QRCodeScanner';
import IconButton from 'components/IconButton';
import WalletTabs from 'components/Tabs/WalletTabs';
import HTMLContentModal from 'components/Modals/HTMLContentModal';
import { NextFooter } from 'components/Layout/NextFooter';
import Checkbox from 'components/Checkbox';
import { fontSizes, baseColors, UIColors, spacing } from 'utils/variables';

type Props = {
  importWalletFromTWordsPhrase: (tWordsPhrase: string) => Function,
  importWalletFromPrivateKey: (privateKey: string) => Function,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
  resetWalletError: Function,
};

type State = {
  privateKey: string,
  tWordsPhrase: string,
  errorMessage: string,
  errorField: string,
  isScanning: boolean,
  activeTab: string,
  inputEnabled: boolean,
  visibleModal: string,
  hasAgreedToTerms: boolean,
  hasAgreedToPolicy: boolean,
};

const window = Dimensions.get('window');

const TERMS_OF_USE_MODAL = 'TERMS_OF_USE_MODAL';
const PRIVACY_POLICY_MODAL = 'PRIVACY_POLICY_MODAL';

const InputWrapper = styled.View`
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
  margin-top: 20px;
`;

const ButtonWrapper = styled.View`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-left: 14px;
  margin-top: 6px;
`;

const CheckboxText = styled(BaseText)`
  font-size: ${fontSizes.extraSmall}px;
  line-height: 20px;
  color: ${baseColors.coolGrey};
`;

const StyledTextLink = styled(TextLink)`
  font-size: ${fontSizes.extraSmall}px;
  line-height: 20px;
  color: ${baseColors.rockBlue};
`;

class ImportWallet extends React.Component<Props, State> {
  state = {
    privateKey: '',
    tWordsPhrase: '',
    errorMessage: '',
    errorField: '',
    isScanning: false,
    activeTab: TWORDSPHRASE,
    inputEnabled: false,
    visibleModal: '',
    hasAgreedToTerms: false,
    hasAgreedToPolicy: false,
  };

  physicalBackAction = () => {
    this.handleBackAction();
    return true;
  };

  componentDidMount() {
    const { navigation } = this.props;
    const navigateTo = navigation.getParam('navigateTo', null);

    if (Platform.OS === 'android' && navigateTo) {
      BackHandler.addEventListener('hardwareBackPress', this.physicalBackAction);
    }
  }

  componentWillUnmount() {
    if (Platform.OS === 'android') {
      BackHandler.removeEventListener('hardwareBackPress', this.physicalBackAction);
    }
  }

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    const { walletState, error } = nextProps.wallet;

    if (walletState === WALLET_ERROR && error.code === IMPORT_ERROR) {
      return {
        ...prevState,
        errorMessage: error.message,
        errorField: error.field,
      };
    } else if (walletState !== WALLET_ERROR) {
      return {
        ...prevState,
        errorMessage: '',
        errorField: '',
      };
    }
    return null;
  }

  handleImportSubmit = () => {
    Keyboard.dismiss();
    const { importWalletFromTWordsPhrase, importWalletFromPrivateKey } = this.props;
    const { privateKey, tWordsPhrase, activeTab } = this.state;

    if (activeTab === PRIVATEKEY) {
      importWalletFromPrivateKey(privateKey);
    } else if (activeTab === TWORDSPHRASE) {
      const trimmedPhrase = tWordsPhrase.split(' ').filter(Boolean).join(' ');
      importWalletFromTWordsPhrase(trimmedPhrase);
    } else {
      this.setState({ errorField: '' });
    }
  };

  handleQRScannerOpen = async () => {
    this.setState({ isScanning: !this.state.isScanning },
      () => {
        if (this.state.isScanning) {
          Keyboard.dismiss();
        }
      });
  };

  handleQRScannerClose = () => {
    this.setState({ isScanning: false });
  };

  handleQRRead = (privateKey: string) => {
    this.setState({ privateKey, isScanning: false });
  };

  getError = (errorField: string) => {
    if (errorField === this.state.errorField) {
      return this.state.errorMessage;
    }
    return '';
  };

  handleBackAction = () => {
    const { navigation, resetWalletError } = this.props;
    resetWalletError();
    const navigateTo = navigation.getParam('navigateTo', null);
    if (navigateTo) {
      navigation.navigate(navigateTo);
    } else {
      navigation.goBack(null);
    }
  };

  handleValueChange = (field) => (value) => {
    this.setState({
      [field]: value,
    });
    this.props.resetWalletError();
  };

  setActiveTab = (activeTab) => {
    this.setState({
      activeTab,
    });
  };

  closeModals = () => {
    this.setState({ visibleModal: '' });
  };

  renderForm = (tabsInfo) => {
    const { activeTab } = this.state;
    const inputProps = {
      onChange: this.handleValueChange(tabsInfo[activeTab].changeName),
      value: tabsInfo[activeTab].value,
      autoCapitalize: 'none',
      importantForAutofill: 'no',
      autoComplete: 'off',
    };
    let additionalProps = {};

    let inputWidth = window.width - 95;

    if (activeTab === TWORDSPHRASE) {
      inputWidth = window.width - (spacing.rhythm * 2) - 2;
      additionalProps = {
        multiline: true,
        numberOfLines: 3,
      };
    }

    return (
      <React.Fragment>
        <TextInput
          inputProps={{ ...inputProps, ...additionalProps }}
          inputType="secondary"
          noBorder
          keyboardAvoidance
          viewWidth={inputWidth}
          errorMessage={tabsInfo[activeTab].errorMessage}
        />
        {activeTab === PRIVATEKEY &&
          <ButtonWrapper error={!!tabsInfo[activeTab].errorMessage}>
            <IconButton
              icon="scan"
              color={baseColors.electricBlue}
              fontSize={fontSizes.extraLarge}
              onPress={this.handleQRScannerOpen}
              iconText="SCAN"
              style={{
                marginLeft: 5,
                marginBottom: 3,
                alignItems: 'center',
              }}
            />
          </ButtonWrapper>}
      </React.Fragment>
    );
  };

  render() {
    const {
      privateKey,
      tWordsPhrase,
      isScanning,
      activeTab,
      visibleModal,
      hasAgreedToTerms,
      hasAgreedToPolicy,
    } = this.state;

    const restoreWalletTabs = [
      {
        id: TWORDSPHRASE,
        name: '12 word',
        onPress: () => this.setActiveTab(TWORDSPHRASE),
      },
      {
        id: PRIVATEKEY,
        name: 'Private key',
        onPress: () => this.setActiveTab(PRIVATEKEY),
      },
    ];

    const tabsInfo = {
      TWORDSPHRASE: {
        textStart: 'Restore your ERC-20 compatible Ethereum wallet using your ',
        textAttention: '12 word backup phrase',
        textEnd: '.',
        inputLabel: 'Backup phrase',
        changeName: 'tWordsPhrase',
        value: tWordsPhrase,
        errorMessage: this.getError(IMPORT_WALLET_TWORDS_PHRASE),
      },
      PRIVATEKEY: {
        textStart: 'Don\'t have your backup phrase? Use your ',
        textAttention: 'private key',
        textEnd: ' instead.',
        inputLabel: 'Private key',
        changeName: 'privateKey',
        value: privateKey,
        errorMessage: this.getError(IMPORT_WALLET_PRIVATE_KEY),
      },
    };

    const canGoNext = hasAgreedToTerms && hasAgreedToPolicy && !!tabsInfo[activeTab].value;

    return (
      <ContainerWithHeader
        headerProps={({
          default: true,
          lighterHeader: true,
          centerItems: [{ title: 'Restore wallet' }],
        })}
        backgroundColor={baseColors.white}
        keyboardAvoidFooter={(
          <NextFooter
            onNextPress={this.handleImportSubmit}
            nextDisabled={!canGoNext}
            wrapperStyle={{ paddingTop: 30, paddingBottom: 30 }}
          >
            <Checkbox
              onPress={() => { this.setState({ hasAgreedToTerms: !hasAgreedToTerms }); }}
              small
              lightText
              darkCheckbox
              wrapperStyle={{ marginBottom: 16 }}
            >
              <CheckboxText>
                {'I have read, understand, and agree to the '}
                <StyledTextLink
                  onPress={() => { this.setState({ visibleModal: TERMS_OF_USE_MODAL }); }}
                >
                  Terms of Use
                </StyledTextLink>
              </CheckboxText>
            </Checkbox>
            <Checkbox
              onPress={() => { this.setState({ hasAgreedToPolicy: !hasAgreedToPolicy }); }}
              small
              lightText
              darkCheckbox
            >
              <CheckboxText>
                {'I have read, understand, and agree to the '}
                <StyledTextLink
                  onPress={() => { this.setState({ visibleModal: PRIVACY_POLICY_MODAL }); }}
                >
                  Privacy policy
                </StyledTextLink>
              </CheckboxText>
            </Checkbox>
          </NextFooter>
        )}
      >
        <ScrollWrapper regularPadding disableAutomaticScroll keyboardShouldPersistTaps="always">
          <WalletTabs title="restore wallet" tabs={restoreWalletTabs} />
          <Paragraph small light>{tabsInfo[activeTab].textStart}
            <BaseText style={{ color: UIColors.defaultTextColor }}>
              {tabsInfo[activeTab].textAttention}
            </BaseText>
            {tabsInfo[activeTab].textEnd}
          </Paragraph>
          <InputWrapper error={!!tabsInfo[activeTab].errorMessage}>
            {this.renderForm(tabsInfo)}
          </InputWrapper>
        </ScrollWrapper>
        <QRCodeScanner
          isActive={isScanning}
          onDismiss={this.handleQRScannerClose}
          onRead={this.handleQRRead}
        />

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
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  importWalletFromTWordsPhrase: (tWordsPhrase) => {
    dispatch(importWalletFromTWordsPhraseAction(tWordsPhrase));
  },
  importWalletFromPrivateKey: (privateKey) => {
    dispatch(importWalletFromPrivateKeyAction(privateKey));
  },
  resetWalletError: () => {
    dispatch(resetWalletErrorAction());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ImportWallet);
