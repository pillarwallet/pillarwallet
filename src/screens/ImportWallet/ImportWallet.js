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
import styled from 'styled-components/native';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

// actions
import { resetWalletImportErrorAction, importWalletFromMnemonicAction } from 'actions/onboardingActions';

// components
import { ScrollWrapper, Wrapper } from 'components/legacy/Layout';
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import { BaseText, MediumText } from 'components/legacy/Typography';
import TextInput from 'components/legacy/TextInput';
import Tabs from 'components/legacy/Tabs';
import Button from 'components/legacy/Button';

// constants
import { TWORDSPHRASE } from 'constants/walletConstants';

// utils
import { spacing, fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';

type Props = {
  importWalletFromMnemonic: (mnemonic: string) => void,
  wallet: Object,
  errorMessage: ?string,
  navigation: NavigationScreenProp<*>,
  resetWalletError: () => void,
  isImportingWallet: boolean,
};

type State = {
  tWordsPhrase: string,
  activeTab: string,
  backupPhrase: Object,
  currentWordIndex: number,
  currentBPWord: string,
  importError: string,
};

const DEV = 'DEV';

const getButtonLabel = (currentWordIndex, error, importError) => {
  if ((error || importError) && currentWordIndex === 12) {
    return { text: t('auth:button.tryAgain'), showArrow: false };
  } else if (currentWordIndex < 12) {
    return { text: t('auth:button.next'), showArrow: true };
  }
  return { text: t('auth:button.finish'), showArrow: false };
};

class ImportWallet extends React.Component<Props, State> {
  backupPhraseInput: Object;
  devPhraseInput: Object;

  state = {
    tWordsPhrase: '',
    backupPhrase: {},
    currentBPWord: '',
    currentWordIndex: 1,
    activeTab: TWORDSPHRASE,
    importError: '',
  };

  handleImportSubmit = () => {
    requestAnimationFrame(() => {
      Keyboard.dismiss();
      const { importWalletFromMnemonic, navigation } = this.props;
      const { tWordsPhrase, activeTab, backupPhrase } = this.state;

      const wallet = navigation.getParam('wallet', null);

      if (activeTab === TWORDSPHRASE) {
        const trimmedPhrase = Object.values(backupPhrase).join(' ');
        if (wallet?.mnemonic !== trimmedPhrase) {
          importWalletFromMnemonic(trimmedPhrase);
        } else {
          this.setState({
            importError: t('auth:error.incorrectBackupPhrase.importWalletError'),
          });
        }
        //  importWalletFromMnemonic(trimmedPhrase);
      } else if (activeTab === DEV) {
        const trimmedPhrase = tWordsPhrase.split(' ').filter(Boolean).join(' ');
        importWalletFromMnemonic(trimmedPhrase);
      }
    });
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
    const { errorMessage } = this.props;
    const { activeTab, backupPhrase, currentWordIndex, importError } = this.state;
    const inputProps = {
      onChange: this.handleValueChange(tabsInfo[activeTab].changeName),
      value: tabsInfo[activeTab].value,
      autoCapitalize: 'none',
      importantForAutofill: 'no',
      autoComplete: 'off',
    };

    if (activeTab === DEV) {
      return (
        <TextInput
          getInputRef={(ref) => {
            this.devPhraseInput = ref;
          }}
          inputProps={{
            ...inputProps,
            multiline: true,
            numberOfLines: 2,
          }}
          errorMessage={errorMessage}
          onLayout={() => {
            if (!this.devPhraseInput) return;
            this.devPhraseInput.focus();
          }}
          testID={`${TAG}-input-phrase_word`}
          // eslint-disable-next-line i18next/no-literal-string
          accessibilityLabel={`${TAG}-input-phrase_word`}
        />
      );
    }

    return (
      <React.Fragment>
        <Row>
          {Object.keys(backupPhrase).map((key) => {
            return (
              <BackupWordText key={key} testID={`${TAG}-text-seed_word_${key}`}>
                {`${key}. ${backupPhrase[key]}`}
              </BackupWordText>
            );
          })}
        </Row>
        <Label testID={`${TAG}-text-seed_word_index`}>{t('auth:seedWord', { wordNumber: currentWordIndex })}</Label>
        <TextInput
          getInputRef={(ref) => {
            this.backupPhraseInput = ref;
          }}
          inputProps={{
            ...inputProps,
            returnKeyType: 'next',
            blurOnSubmit: false,
            onSubmit: this.showNextWord,
          }}
          additionalStyle={{ textAlign: 'center' }}
          errorMessage={errorMessage || importError}
          onLayout={() => {
            if (!this.backupPhraseInput) return;
            this.backupPhraseInput.focus();
          }}
          testID={`${TAG}-input-phrase_word`}
          // eslint-disable-next-line i18next/no-literal-string
          accessibilityLabel={`${TAG}-input-phrase_word`}
        />
      </React.Fragment>
    );
  };

  renderFooterButtons = (tabsInfo) => {
    const { activeTab, currentBPWord, currentWordIndex, importError } = this.state;
    const { isImportingWallet } = this.props;

    if (activeTab === TWORDSPHRASE) {
      const { errorMessage } = this.props;
      const showPrev = currentWordIndex > 1 && !isImportingWallet;
      const { text: nextButtonText, showArrow: showBackArrow } = getButtonLabel(
        currentWordIndex,
        errorMessage,
        importError,
      );
      return (
        <ButtonsWrapper isRow>
          {!!showPrev && (
            <StyledButton
              title={t('auth:button.prev')}
              onPress={this.showPrevWord}
              leftIconName="back"
              disabled={isImportingWallet}
              secondary
              block={false}
              testID={`${TAG}-button-prev_word`}
            />
          )}
          <StyledButton
            title={nextButtonText}
            onPress={this.showNextWord}
            rightIconName={showBackArrow ? 'back' : null}
            rightIconStyle={{ transform: [{ rotate: '180deg' }] }}
            disabled={!currentBPWord || isImportingWallet}
            isLoading={isImportingWallet}
            block={false}
            testID={`${TAG}-button-next_word`}
          />
        </ButtonsWrapper>
      );
    }

    return (
      <Button
        disabled={!tabsInfo[activeTab].value || isImportingWallet}
        title={t('auth:button.reimport')}
        onPress={this.handleImportSubmit}
        isLoading={isImportingWallet}
        testID={`${TAG}-button-reimport_wallet`}
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
    const { tWordsPhrase, currentBPWord, activeTab } = this.state;

    const restoreWalletTabs = [
      {
        id: TWORDSPHRASE,
        name: t('auth:title.backupPhrase'),
        onPress: () => this.setActiveTab(TWORDSPHRASE),
        testID: `${TAG}-button-tab.${TWORDSPHRASE}`, // eslint-disable-line i18next/no-literal-string
      },
    ];

    if (__DEV__) {
      restoreWalletTabs.push({
        id: DEV,
        name: "Dev's phrase", // eslint-disable-line i18next/no-literal-string
        onPress: () => this.setActiveTab(DEV),
        testID: `${TAG}-button-tab.${DEV}`, // eslint-disable-line i18next/no-literal-string
      });
    }

    const tabsInfo = {
      TWORDSPHRASE: {
        inputLabel: t('auth:label.backupPhrase'),
        changeName: 'currentBPWord',
        value: currentBPWord,
      },
      DEV: {
        inputLabel: t('auth:label.backupPhrase'),
        changeName: 'tWordsPhrase',
        value: tWordsPhrase,
      },
    };

    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: t('auth:title.reimportWallet') }],
        }}
        footer={<FooterWrapper>{this.renderFooterButtons(tabsInfo)}</FooterWrapper>}
      >
        <ScrollWrapper contentContainerStyle={{ flex: 1 }} disableAutomaticScroll keyboardShouldPersistTaps="always">
          {__DEV__ && <Tabs tabs={restoreWalletTabs} wrapperStyle={{ marginTop: 16 }} activeTab={activeTab} />}
          <Wrapper regularPadding>
            {!__DEV__ && (
              <MediumText center style={{ marginTop: spacing.large }}>
                {t('auth:label.enterSeedPhrase')}
              </MediumText>
            )}
            <InputWrapper>
              <FormWrapper>{this.renderForm(tabsInfo)}</FormWrapper>
            </InputWrapper>
          </Wrapper>
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({
  onboarding: { wallet, errorMessage, isImportingWallet },
}: RootReducerState): $Shape<Props> => ({
  wallet,
  errorMessage,
  isImportingWallet,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  importWalletFromMnemonic: (mnemonic) => dispatch(importWalletFromMnemonicAction(mnemonic)),
  resetWalletError: () => dispatch(resetWalletImportErrorAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(ImportWallet);

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
  flex-direction: ${(props) => (props.isRow ? 'row' : 'column')};
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
  margin-bottom: ${spacing.large}px;
`;

const BackupWordText = styled(BaseText)`
  ${fontStyles.regular};
  margin: 4px 2px;
  align-items: flex-start;
  color: ${themedColors.secondaryText};
`;

const TAG = 'ImportWallet';
