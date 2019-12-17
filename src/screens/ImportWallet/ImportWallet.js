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
import { Keyboard } from 'react-native';
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
import { BaseText, MediumText } from 'components/Typography';
import TextInput from 'components/TextInput';
import QRCodeScanner from 'components/QRCodeScanner';
import Tabs from 'components/Tabs';
import Button from 'components/Button';
import Icon from 'components/Icon';
import { fontSizes, spacing, fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

type Props = {
  importWalletFromTWordsPhrase: (tWordsPhrase: string) => void,
  importWalletFromPrivateKey: (privateKey: string) => void,
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
  backupPhrase: Object,
  currentWordIndex: number,
  currentBPWord: string,
};

const DEV = 'DEV';

const InputWrapper = styled.View`
  flex-direction: row;
  align-items: flex-start;
  width: 100%;
  margin-top: 20px;
`;

const FooterWrapper = styled.View`
  justify-content: center;
  align-items: center;
  padding: ${spacing.large}px;
  width: 100%;
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
  color: ${themedColors.accent};
  width: 100%;
  text-align: center;
  margin-bottom: 10px;
`;

const FormWrapper = styled.View`
  flex-direction: column;
  width: 100%;
`;

const Row = styled.View`
  flex-direction: row;
  flex-wrap: wrap;
  flex: 1;
  margin-bottom: ${spacing.large}px;
`;

const BackupWordText = styled(BaseText)`
  ${fontStyles.regular};
  margin: 4px 2px;
  align-items: flex-start;
  color: ${themedColors.secondaryText};
`;

const ScannerButton = styled.TouchableOpacity`
  margin-top: 16px;
  flex-direction: row;
  align-items: center;
`;

const ButtonText = styled(BaseText)`
  color: ${themedColors.primary};
  font-size: ${fontSizes.medium}px;
`;

const ButtonIcon = styled(CachedImage)`
  height: 24px;
  width: 24px;
  justify-content: center;
  margin-right: 8px;
`;

const ButtonInner = styled.View`
  flex-direction: row;
  align-items: center;
`;

const ButtonLabel = styled(MediumText)`
  color: ${({ primary, theme }) => primary ? theme.colors.primary : theme.colors.control};
  font-size: ${fontSizes.big}px;
  margin-bottom: 2px;
`;

const ButtonIconArrow = styled(Icon)`
  font-size: ${fontSizes.big}px;
  color: ${({ primary, theme }) => primary ? theme.colors.primary : theme.colors.control};
  ${props => props.isOnLeft ? 'margin-right: 5px;' : 'margin-left: 5px;'}
  ${props => props.flip ? 'transform: rotate(180deg);' : ''}
`;

const getButtonLabel = (currentWordIndex, error) => {
  if (error && currentWordIndex === 12) {
    return { text: 'Try again', showArrow: false };
  } else if (currentWordIndex < 12) {
    return { text: 'Next', showArrow: true };
  }
  return { text: 'Finish', showArrow: false };
};

const iconReceive = require('assets/icons/icon_receive.png');

class ImportWallet extends React.Component<Props, State> {
  backupPhraseInput: Object;
  privKeyInput: Object;
  devPhraseInput: Object;

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
  };

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

  renderForm = (tabsInfo) => {
    const { activeTab, backupPhrase, currentWordIndex } = this.state;
    const inputProps = {
      onChange: this.handleValueChange(tabsInfo[activeTab].changeName),
      value: tabsInfo[activeTab].value,
      autoCapitalize: 'none',
      importantForAutofill: 'no',
      autoComplete: 'off',
    };

    if (activeTab === PRIVATEKEY) {
      return (
        <React.Fragment>
          <Label style={{ marginBottom: 20 }}>Paste your private key</Label>
          <TextInput
            getInputRef={(ref) => { this.privKeyInput = ref; }}
            inputProps={{
              ...inputProps,
              multiline: true,
              numberOfLines: 3,
            }}
            keyboardAvoidance
            errorMessage={tabsInfo[activeTab].errorMessage}
            additionalStyle={{ textAlign: 'center' }}
            errorMessageStyle={{ textAlign: 'center' }}
            onLayout={() => {
              this.privKeyInput._root.focus();
            }}
          />
        </React.Fragment>
      );
    }

    if (activeTab === DEV) {
      return (
        <TextInput
          getInputRef={(ref) => { this.devPhraseInput = ref; }}
          inputProps={{
            ...inputProps,
            multiline: true,
            numberOfLines: 2,
          }}
          errorMessage={tabsInfo[activeTab].errorMessage}
          onLayout={() => {
            this.devPhraseInput._root.focus();
          }}
        />
      );
    }

    return (
      <React.Fragment>
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
          errorMessage={tabsInfo[activeTab].errorMessage}
          onLayout={() => {
            this.backupPhraseInput._root.focus();
          }}
        />
      </React.Fragment>
    );
  };

  renderFooterButtons = (tabsInfo) => {
    const { activeTab, currentBPWord, currentWordIndex } = this.state;

    if (activeTab === TWORDSPHRASE) {
      const { errorMessage } = tabsInfo[activeTab];
      const showPrev = currentWordIndex > 1;
      const { text: nextButtonText, showArrow: showBackArrow } = getButtonLabel(currentWordIndex, errorMessage);
      return (
        <ButtonsWrapper isRow>
          {!!showPrev &&
          <StyledButton
            primaryInverted
            onPress={this.showPrevWord}
          >
            <ButtonInner>
              <ButtonIconArrow name="back" primary isOnLeft />
              <ButtonLabel primary>Prev</ButtonLabel>
            </ButtonInner>
          </StyledButton>}
          <StyledButton
            disabled={!currentBPWord}
            onPress={this.showNextWord}
          >
            <ButtonInner>
              <ButtonLabel>{nextButtonText}</ButtonLabel>
              {!!showBackArrow && <ButtonIconArrow name="back" flip />}
            </ButtonInner>
          </StyledButton>
        </ButtonsWrapper>
      );
    } else if (activeTab === PRIVATEKEY) {
      return (
        <ButtonsWrapper>
          <Button
            disabled={!tabsInfo[activeTab].value}
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
        title="Re-import"
        onPress={this.handleImportSubmit}
      />
    );
  };

  onBackupPhraseWordChange = (value) => {
    const { backupPhrase, currentWordIndex } = this.state;
    const noSpacesRegex = /^\S*$/;
    if (value.match(noSpacesRegex)) {
      this.setState({
        currentBPWord: value,
        backupPhrase: { ...backupPhrase, [currentWordIndex]: value },
      });
    }
    this.props.resetWalletError();
  };

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

    return (
      <ContainerWithHeader
        headerProps={({ centerItems: [{ title: 'Re-import wallet' }] })}
        keyboardAvoidFooter={(
          <FooterWrapper>
            {this.renderFooterButtons(tabsInfo)}
          </FooterWrapper>
        )}
      >
        <ScrollWrapper disableAutomaticScroll keyboardShouldPersistTaps="always">
          <Tabs tabs={restoreWalletTabs} wrapperStyle={{ marginTop: 8 }} />
          <Wrapper regularPadding>
            <InputWrapper>
              <FormWrapper>
                {this.renderForm(tabsInfo)}
              </FormWrapper>
            </InputWrapper>
          </Wrapper>
        </ScrollWrapper>
        <QRCodeScanner
          isActive={isScanning}
          onCancel={this.handleQRScannerClose}
          onRead={this.handleQRRead}
        />
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({ wallet }: RootReducerState): $Shape<Props> => ({ wallet });

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
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
