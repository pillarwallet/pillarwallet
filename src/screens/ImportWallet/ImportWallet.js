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
import { CachedImage } from 'react-native-cached-image';
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
import { ScrollWrapper, Wrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText } from 'components/Typography';
import TextInput from 'components/TextInput';
import QRCodeScanner from 'components/QRCodeScanner';
import Tabs from 'components/Tabs';
import HTMLContentModal from 'components/Modals/HTMLContentModal';
import Button from 'components/Button';
import { fontSizes, baseColors, spacing } from 'utils/variables';

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
  backupPhrase: Object,
  currentWordIndex: number,
  currentBPWord: string,
};

const window = Dimensions.get('window');

const TERMS_OF_USE_MODAL = 'TERMS_OF_USE_MODAL';
const PRIVACY_POLICY_MODAL = 'PRIVACY_POLICY_MODAL';
const DEV = 'DEV';

const InputWrapper = styled.View`
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
  margin-top: 20px;
`;
//
// const ButtonWrapper = styled.View`
//   display: flex;
//   justify-content: center;
//   align-items: center;
//   margin-left: 14px;
//   margin-top: 6px;
// `;

// const CheckboxText = styled(BaseText)`
//   font-size: ${fontSizes.extraSmall}px;
//   line-height: 20px;
//   color: ${baseColors.coolGrey};
// `;
//
// const StyledTextLink = styled(TextLink)`
//   font-size: ${fontSizes.extraSmall}px;
//   line-height: 20px;
//   color: ${baseColors.rockBlue};
// `;

const FooterWrapper = styled.View`
  justify-content: center;
  align-items: center;
  padding: ${spacing.large}px;
  width: 100%;
  background-color: ${baseColors.white};
`;

const ButtonsWrapper = styled.View`
  justify-content: center;
  align-items: center;
  flex-direction: ${props => props.isRow ? 'row' : 'column'};
`;

const StyledButton = styled(Button)`
  margin: 0 6px;
`;

const Label = styled(BaseText)`
  color: ${baseColors.blueYonder};
  width: 100%;
  text-align: center;
  margin-bottom: 10px;
`;

const FormWrapper = styled.View`
  flex-direction: column;
`;

const Row = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  flex: 1;
  margin-bottom: ${spacing.large}px;
`;

const BackupWordText = styled(BaseText)`
  margin: 4px 2px;
  align-items: flex-start;
  color: ${baseColors.mediumGray};
  font-size: ${fontSizes.extraSmall}px;
`;

const ScannerButton = styled.TouchableOpacity`
  margin-top: 16px;
  flex-direction: row;
  align-items: center;
`;

const ButtonText = styled(BaseText)`
  color: ${baseColors.electricBlue};
  font-size: ${fontSizes.small}px;
`;

const ButtonIcon = styled(CachedImage)`
  height: 24px;
  width: 24px;
  justify-content: center;
  margin-right: 8px; 
`;

const getButtonLabel = (currentWordIndex, error) => {
  if (error) {
    return 'Try again';
  } else if (currentWordIndex < 12) {
    return 'Next';
  }
  return 'Finish';
};

const iconReceive = require('assets/icons/icon_receive.png');

class ImportWallet extends React.Component<Props, State> {
  backupPhraseInput: Object;

  // backupPhraseInput = React.createRef();

  state = {
    privateKey: '',
    tWordsPhrase: '',
    backupPhrase: {},
    currentBPWord: '',
    currentWordIndex: 1,
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
    const { activeTab } = prevState;
    const { walletState, error } = nextProps.wallet;

    if (walletState === WALLET_ERROR && error.code === IMPORT_ERROR) {
      const errorMessage = activeTab === PRIVATEKEY ? 'Incorrect private key' : 'Incorrect backup phrase';
      return {
        ...prevState,
        errorMessage,
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
    const {
      privateKey,
      tWordsPhrase,
      activeTab,
      backupPhrase,
    } = this.state;

    if (activeTab === PRIVATEKEY) {
      importWalletFromPrivateKey(privateKey);
    } else if (activeTab === TWORDSPHRASE) {
      const trimmedPhrase = Object.values(backupPhrase).join(' ');
      importWalletFromTWordsPhrase(trimmedPhrase);
    } else if (activeTab === DEV) {
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

  handleQRScannerClose = () => this.setState({ isScanning: false });

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
    if (field === 'currentBPWord') {
      this.onBackupPhraseWordChange(value);
    } else {
      this.setState({
        [field]: value,
      });
    }
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
    const { activeTab, backupPhrase, currentWordIndex } = this.state;
    const inputProps = {
      onChange: this.handleValueChange(tabsInfo[activeTab].changeName),
      value: tabsInfo[activeTab].value,
      autoCapitalize: 'none',
      importantForAutofill: 'no',
      autoComplete: 'off',
    };
    const inputWidth = window.width - (spacing.rhythm * 2) - 2;

    if (activeTab === PRIVATEKEY) {
      return (
        <FormWrapper>
          <Label style={{ marginBottom: 20 }}>Paste your private key</Label>
          <TextInput
            inputProps={{
              ...inputProps,
              multiline: true,
              numberOfLines: 3,
            }}
            inputType="noBackground"
            noBorder
            keyboardAvoidance
            viewWidth={inputWidth}
            errorMessage={tabsInfo[activeTab].errorMessage}
            additionalStyle={{ textAlign: 'center', paddingRight: 0 }}
            errorMessageStyle={{ textAlign: 'center', color: baseColors.chestnutRose }}
          />
        </FormWrapper>
      );
    }

    if (activeTab === DEV) {
      return (
        <TextInput
          inputProps={{
            ...inputProps,
            multiline: true,
            numberOfLines: 2,
          }}
          inputType="secondary"
          noBorder
          keyboardAvoidance
          viewWidth={inputWidth}
          errorMessage={tabsInfo[activeTab].errorMessage}
        />
      );
    }

    return (
      <FormWrapper>
        <Row>
          {Object.keys(backupPhrase).map((key) => {
            return (<BackupWordText key={key}>{`${key}. ${backupPhrase[key]}`}</BackupWordText>);
          })}
        </Row>
        <Label>{`Word ${currentWordIndex}`}</Label>
        <TextInput
          getInputRef={(ref) => { this.backupPhraseInput = ref; }}
          inputProps={inputProps}
          additionalStyle={{ textAlign: 'center' }}
          inputType="bigTextNoBackground"
          noBorder
          keyboardAvoidance
          viewWidth={inputWidth}
          errorMessage={tabsInfo[activeTab].errorMessage}
          errorMessageStyle={{ textAlign: 'center', color: baseColors.chestnutRose }}
          onLayout={() => {
            // this.backupPhraseInput.focus();
          }}
        />
      </FormWrapper>
    );
  };

  renderFooterButtons = (tabsInfo) => {
    const { activeTab, currentBPWord, currentWordIndex } = this.state;

    if (activeTab === TWORDSPHRASE) {
      const { errorMessage } = tabsInfo[activeTab];
      const showPrev = currentWordIndex > 1;
      const nextButtonText = getButtonLabel(currentWordIndex, errorMessage);
      return (
        <ButtonsWrapper isRow>
          {!!showPrev &&
          <StyledButton
            primaryInvertedSquare
            title="Prev"
            onPress={this.showPrevWord}
          />}
          <StyledButton
            disabled={!currentBPWord}
            primarySquare
            title={nextButtonText}
            onPress={this.showNextWord}
          />
        </ButtonsWrapper>
      );
    } else if (activeTab === PRIVATEKEY) {
      return (
        <ButtonsWrapper>
          <Button
            disabled={!tabsInfo[activeTab].value}
            primarySquare
            title="Re-import"
            onPress={this.handleImportSubmit}
          />
          <ScannerButton onPress={this.handleQRScannerOpen}>
            <ButtonIcon source={iconReceive} />
            <ButtonText>QR code scan</ButtonText>
          </ScannerButton>
        </ButtonsWrapper>
      );
    }

    return (
      <Button
        disabled={!tabsInfo[activeTab].value}
        primarySquare
        title="Re-import"
        onPress={this.handleImportSubmit}
      />
    );
  };

  onBackupPhraseWordChange = (value) => {
    // TODO: check if correct form (no spacings)
    const { backupPhrase, currentWordIndex } = this.state;
    const noSpacesRegex = /^\S*$/;
    if (value.match(noSpacesRegex)) {
      this.setState({
        currentBPWord: value,
        backupPhrase: { ...backupPhrase, [currentWordIndex]: value },
      });
    }
    // else if (value.replace(/ /g,'').length) {
    //   this.showNextWord();
    // }
    this.props.resetWalletError();
  }

  showNextWord = () => {
    const { backupPhrase, currentWordIndex } = this.state;
    const nextWordIndex = currentWordIndex + 1;
    if (currentWordIndex < 12) {
      this.setState({
        currentWordIndex: nextWordIndex,
        currentBPWord: backupPhrase[nextWordIndex],
      });
    } else {
      this.handleImportSubmit();
    }
  };

  showPrevWord = () => {
    const { backupPhrase, currentWordIndex } = this.state;
    const prevWordIndex = currentWordIndex - 1;
    const prevWord = backupPhrase[prevWordIndex];
    this.setState({ currentBPWord: prevWord, currentWordIndex: prevWordIndex });
  };

  render() {
    const {
      privateKey,
      tWordsPhrase,
      isScanning,
      // activeTab,
      visibleModal,
      // hasAgreedToTerms,
      // hasAgreedToPolicy,
      currentBPWord,
    } = this.state;

    const restoreWalletTabs = [
      {
        id: TWORDSPHRASE,
        name: 'Backup phrase',
        onPress: () => this.setActiveTab(TWORDSPHRASE),
      },
      {
        id: PRIVATEKEY,
        name: 'Private key',
        onPress: () => this.setActiveTab(PRIVATEKEY),
      },
    ];

    if (__DEV__) {
      restoreWalletTabs.push({
        id: DEV,
        name: 'Dev\'s phrase',
        onPress: () => this.setActiveTab(DEV),
      });
    }

    const tabsInfo = {
      TWORDSPHRASE: {
        inputLabel: 'Backup phrase',
        changeName: 'currentBPWord',
        value: currentBPWord,
        errorMessage: this.getError(IMPORT_WALLET_TWORDS_PHRASE),
      },
      PRIVATEKEY: {
        inputLabel: 'Private key',
        changeName: 'privateKey',
        value: privateKey,
        errorMessage: this.getError(IMPORT_WALLET_PRIVATE_KEY),
      },
      DEV: {
        inputLabel: 'Backup phrase',
        changeName: 'tWordsPhrase',
        value: tWordsPhrase,
        errorMessage: this.getError(IMPORT_WALLET_TWORDS_PHRASE),
      },
    };

    // const canGoNext = hasAgreedToTerms && hasAgreedToPolicy && !!tabsInfo[activeTab].value;

    return (
      <ContainerWithHeader
        headerProps={({
          centerItems: [{ title: 'Re-import wallet' }],
          customOnBack: this.handleBackAction,
        })}
        backgroundColor={baseColors.white}
        keyboardAvoidFooter={(
          <FooterWrapper>
            {this.renderFooterButtons(tabsInfo)}
          </FooterWrapper>
        )}
        // keyboardAvoidFooter={(
        //   <NextFooter
        //     onNextPress={this.handleImportSubmit}
        //     nextDisabled={!canGoNext}
        //     wrapperStyle={{ paddingTop: 30, paddingBottom: 30 }}
        //   >
        //     <Checkbox
        //       onPress={() => { this.setState({ hasAgreedToTerms: !hasAgreedToTerms }); }}
        //       small
        //       lightText
        //       darkCheckbox
        //       wrapperStyle={{ marginBottom: 16 }}
        //     >
        //       <CheckboxText>
        //         {'I have read, understand, and agree to the '}
        //         <StyledTextLink
        //           onPress={() => { this.setState({ visibleModal: TERMS_OF_USE_MODAL }); }}
        //         >
        //           Terms of Use
        //         </StyledTextLink>
        //       </CheckboxText>
        //     </Checkbox>
        //     <Checkbox
        //       onPress={() => { this.setState({ hasAgreedToPolicy: !hasAgreedToPolicy }); }}
        //       small
        //       lightText
        //       darkCheckbox
        //     >
        //       <CheckboxText>
        //         {'I have read, understand, and agree to the '}
        //         <StyledTextLink
        //           onPress={() => { this.setState({ visibleModal: PRIVACY_POLICY_MODAL }); }}
        //         >
        //           Privacy policy
        //         </StyledTextLink>
        //       </CheckboxText>
        //     </Checkbox>
        //   </NextFooter>
        // )}
      >
        <ScrollWrapper disableAutomaticScroll keyboardShouldPersistTaps="always">
          <Tabs tabs={restoreWalletTabs} wrapperStyle={{ marginTop: 8 }} />
          <Wrapper regularPadding>
            <InputWrapper>
              {this.renderForm(tabsInfo)}
            </InputWrapper>
          </Wrapper>
        </ScrollWrapper>
        <QRCodeScanner
          isActive={isScanning}
          onCancel={this.handleQRScannerClose}
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
