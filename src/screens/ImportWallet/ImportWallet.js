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

// actions
import {
  importWalletFromTWordsPhraseAction,
  resetWalletErrorAction,
} from 'actions/walletActions';

// components
import { ScrollWrapper, Wrapper } from 'components/Layout';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { BaseText, MediumText } from 'components/Typography';
import TextInput from 'components/TextInput';
import Tabs from 'components/Tabs';
import Button from 'components/Button';

// constants
import {
  WALLET_ERROR,
  IMPORT_ERROR,
  IMPORT_WALLET_TWORDS_PHRASE,
  TWORDSPHRASE,
  IMPORTING,
  IMPORTED,
} from 'constants/walletConstants';

// utils
import { spacing, fontStyles } from 'utils/variables';
import { themedColors } from 'utils/themes';

// types
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';


type Props = {
  importWalletFromTWordsPhrase: (tWordsPhrase: string) => void,
  wallet: Object,
  navigation: NavigationScreenProp<*>,
  resetWalletError: Function,
};

type State = {
  tWordsPhrase: string,
  errorMessage: string,
  errorField: string,
  activeTab: string,
  inputEnabled: boolean,
  backupPhrase: Object,
  currentWordIndex: number,
  currentBPWord: string,
  isImporting: boolean,
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

const getButtonLabel = (currentWordIndex, error) => {
  if (error && currentWordIndex === 12) {
    return { text: 'Try again', showArrow: false };
  } else if (currentWordIndex < 12) {
    return { text: 'Next', showArrow: true };
  }
  return { text: 'Finish', showArrow: false };
};

class ImportWallet extends React.Component<Props, State> {
  backupPhraseInput: Object;
  devPhraseInput: Object;

  state = {
    tWordsPhrase: '',
    backupPhrase: {},
    currentBPWord: '',
    currentWordIndex: 1,
    errorMessage: '',
    errorField: '',
    activeTab: TWORDSPHRASE,
    inputEnabled: false,
    isImporting: false,
  };

  static getDerivedStateFromProps(nextProps: Props, prevState: State) {
    const { walletState, error } = nextProps.wallet;

    if (walletState === WALLET_ERROR && error.code === IMPORT_ERROR) {
      const errorMessage = 'Incorrect backup phrase';
      return {
        ...prevState,
        errorMessage,
        errorField: error.field,
        isImporting: false,
      };
    } else if (walletState === IMPORTING) {
      return {
        ...prevState,
        isImporting: true,
      };
    } else if (walletState === IMPORTED) {
      return {
        ...prevState,
        isImporting: false,
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
    this.setState({ isImporting: true });
    requestAnimationFrame(() => {
      Keyboard.dismiss();
      const { importWalletFromTWordsPhrase } = this.props;
      const {
        tWordsPhrase,
        activeTab,
        backupPhrase,
      } = this.state;

      if (activeTab === TWORDSPHRASE) {
        const trimmedPhrase = Object.values(backupPhrase).join(' ');
        importWalletFromTWordsPhrase(trimmedPhrase);
      } else if (activeTab === DEV) {
        const trimmedPhrase = tWordsPhrase.split(' ').filter(Boolean).join(' ');
        importWalletFromTWordsPhrase(trimmedPhrase);
      } else {
        this.setState({ errorField: '' });
      }
    });
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
            if (!this.devPhraseInput) return;
            this.devPhraseInput.focus();
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
            if (!this.backupPhraseInput) return;
            this.backupPhraseInput.focus();
          }}
        />
      </React.Fragment>
    );
  };

  renderFooterButtons = (tabsInfo) => {
    const {
      activeTab,
      currentBPWord,
      currentWordIndex,
      isImporting,
    } = this.state;

    if (activeTab === TWORDSPHRASE) {
      const { errorMessage } = tabsInfo[activeTab];
      const showPrev = currentWordIndex > 1 && !isImporting;
      const { text: nextButtonText, showArrow: showBackArrow } = getButtonLabel(currentWordIndex, errorMessage);
      return (
        <ButtonsWrapper isRow>
          {!!showPrev && <StyledButton
            title="Prev"
            onPress={this.showPrevWord}
            leftIconName="back"
            disabled={isImporting}
            secondary
          />}
          <StyledButton
            title={nextButtonText}
            onPress={this.showNextWord}
            rightIconName={showBackArrow ? 'back' : null}
            rightIconStyle={{ transform: [{ rotate: '180deg' }] }}
            disabled={!currentBPWord || isImporting}
            isLoading={isImporting}
          />
        </ButtonsWrapper>
      );
    }

    return (
      <Button
        disabled={!tabsInfo[activeTab].value || isImporting}
        title="Re-import"
        onPress={this.handleImportSubmit}
        isLoading={isImporting}
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
      tWordsPhrase,
      currentBPWord,
      activeTab,
    } = this.state;

    const restoreWalletTabs = [
      {
        id: TWORDSPHRASE,
        name: 'Backup phrase',
        onPress: () => this.setActiveTab(TWORDSPHRASE),
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
        footer={(
          <FooterWrapper>
            {this.renderFooterButtons(tabsInfo)}
          </FooterWrapper>
        )}
      >
        <ScrollWrapper
          contentContainerStyle={{ flex: 1 }}
          disableAutomaticScroll
          keyboardShouldPersistTaps="always"
        >
          {__DEV__ && <Tabs tabs={restoreWalletTabs} wrapperStyle={{ marginTop: 8 }} activeTab={activeTab} />}
          <Wrapper regularPadding>
            {!__DEV__ && <MediumText center style={{ marginTop: spacing.large }}>Enter your 12 words</MediumText>}
            <InputWrapper>
              <FormWrapper>
                {this.renderForm(tabsInfo)}
              </FormWrapper>
            </InputWrapper>
          </Wrapper>
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({ wallet }: RootReducerState): $Shape<Props> => ({ wallet });

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  importWalletFromTWordsPhrase: (tWordsPhrase) => {
    dispatch(importWalletFromTWordsPhraseAction(tWordsPhrase));
  },
  resetWalletError: () => {
    dispatch(resetWalletErrorAction());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(ImportWallet);
