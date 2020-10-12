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
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';

import { fontSizes, spacing } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';
import styled, { withTheme } from 'styled-components/native';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import { Paragraph, Label, MediumText } from 'components/Typography';
import Button from 'components/Button';
import IconButton from 'components/IconButton';
import { backupWalletAction } from 'actions/walletActions';
import type { Dispatch, RootReducerState } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';

type State = {
  enteredWords: string[],
  enteredIndex: string[],
  isFormValid: boolean,
};

type Props = {
  wallet: Object,
  navigation: NavigationScreenProp<*>,
  backupWallet: Function,
  theme: Theme,
};

const WordInputFields = styled.View`
  margin: 20px 0 0;
`;

const MnemonicPhraseWord = styled.TouchableOpacity`
  background-color: ${themedColors.primary};
  border-radius: 6;
  padding: 14px 5px;
  margin: 0 2.5px 5px;
  ${({ disabled }) => disabled && 'opacity: 0.5;'}
`;

const MnemonicPhraseWordText = styled(MediumText)`
  font-size: ${fontSizes.regular}px;
  color: #ffffff;
`;

const WordInputWrapper = styled.View`
  margin-bottom: 5px;
  flex-direction: row;
  align-items: flex-start;
  justify-content: center;
  height: 36px;
`;

const WordInput = styled.View`
  ${({ filled, theme }) => filled && `background-color: ${theme.colors.primary}`};
  border-width: 1;
  border-style: ${props => (props.filled ? 'solid' : 'dashed')};
  border-color:   ${({ filled, theme }) => filled ? 'transparent' : theme.colors.border};
  border-radius: 6px;
  height: 34px;
  flex: 1;
  justify-content: center;
`;

const WordInputPrefix = styled.View`
  flex: 0 0 24px;
  height: 36px;
  justify-content: center;
  align-items: flex-start;
`;

const RemoveWordButtonIcon = styled(IconButton)`
  height: 36px;
  margin-left: 14px;
`;

const WordInputText = styled(MediumText)`
  font-size: ${fontSizes.medium}px;
  color: white;
  margin-left: 10px;
`;

const ShuffledWordWrapper = styled.View`
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin-bottom: 20px;
`;

const ErrorParagraph = styled(Paragraph)`
  color: ${themedColors.negative};
`;

const FooterWrapper = styled.View`
  justify-content: center;
  align-items: center;
  padding: ${spacing.large}px;
  width: 100%;
  background-color: ${themedColors.surface};
`;

const DEBUG_SKIP = 'debugskip';

class BackupPhraseValidate extends React.Component<Props, State> {
  state = {
    enteredWords: [],
    enteredIndex: [],
    isFormValid: false,
  };

  handleWordSetting = (word, index) => {
    let { enteredWords, enteredIndex } = this.state;
    const { onboarding: wallet } = this.props.wallet;
    const maxWords = wallet.mnemonic.wordsToValidate.length;
    if (enteredWords.length === maxWords) return;
    enteredWords = [...enteredWords, word];
    enteredIndex = [...enteredIndex, index];

    this.setState({
      enteredWords,
      enteredIndex,
    }, () => {
      const isFormValid = this.validateForm(this.state.enteredWords);
      this.setState({
        isFormValid,
      });
    });
  };

  handleLastWordRemoval = () => {
    let { enteredWords, enteredIndex } = this.state;
    enteredWords = [...enteredWords.slice(0, -1)];
    enteredIndex = [...enteredIndex.slice(0, -1)];

    this.setState({
      enteredWords,
      enteredIndex,
    }, () => {
      const isFormValid = this.validateForm(this.state.enteredWords);
      this.setState({
        isFormValid,
      });
    });
  };

  validateForm(enteredWords) {
    const { onboarding: wallet } = this.props.wallet;
    const maxWords = wallet.mnemonic.wordsToValidate.length;
    if (enteredWords.length !== maxWords) return false;

    const { wordsToValidate } = wallet.mnemonic;
    const mnemonicList = wallet.mnemonic.original.split(' ');

    const validPhrase = wordsToValidate.map((wordIndex) => {
      return mnemonicList[wordIndex - 1];
    });

    return validPhrase.toString() === enteredWords.toString();
  }

  renderInputFields = () => {
    const { theme, wallet: { onboarding: wallet } } = this.props;
    const { wordsToValidate } = wallet.mnemonic;
    const { enteredWords } = this.state;
    const mnemonicList = wallet.mnemonic.original.split(' ');
    const colors = getThemeColors(theme);

    return [...Array(wordsToValidate.length)]
      .map((el, i) => {
        return (
          <WordInputWrapper key={`${mnemonicList[i]}_${i}`}>
            <WordInputPrefix><Label>{wordsToValidate[i]}</Label></WordInputPrefix>
            <WordInput filled={!!enteredWords[i]}>
              <WordInputText>{enteredWords[i] || ''}</WordInputText>
            </WordInput>
            {enteredWords.length === (i + 1) &&
              <RemoveWordButtonIcon
                icon="close"
                onPress={this.handleLastWordRemoval}
                fontSize={fontSizes.medium}
                color={colors.primary}
              />
            }
          </WordInputWrapper>
        );
      });
  };

  renderShuffledWordList = () => {
    const { onboarding: wallet } = this.props.wallet;
    const { enteredIndex } = this.state;
    const shuffledMnemonicList = wallet.mnemonic.shuffled.split(' ');

    return shuffledMnemonicList.map((word: string, index: number) => {
      const indexAsString = index.toString();
      const isEntered = enteredIndex.includes(indexAsString);
      return (
        <MnemonicPhraseWord
          key={`${word}${index}`}
          onPress={() => this.handleWordSetting(word, indexAsString)}
          disabled={isEntered}
        >
          <MnemonicPhraseWordText>{word}</MnemonicPhraseWordText>
        </MnemonicPhraseWord>
      );
    });
  };

  handlePassedValidation = () => {
    const { navigation, backupWallet } = this.props;
    backupWallet();
    navigation.dismiss();
  };

  render() {
    const { onboarding: wallet } = this.props.wallet;
    const { isFormValid, enteredWords } = this.state;
    if (!wallet.mnemonic.original) return null;

    return (
      <ContainerWithHeader
        headerProps={{ centerItems: [{ title: t('title.verifyBackupPhrase') }] }}
        footer={(
          <FooterWrapper>
            <ShuffledWordWrapper>
              {this.renderShuffledWordList()}
              {!!__DEV__ && (
                <MnemonicPhraseWord
                  key="automagical"
                  onPress={this.handlePassedValidation}
                >
                  <MnemonicPhraseWordText>{DEBUG_SKIP}</MnemonicPhraseWordText>
                </MnemonicPhraseWord>
              )}
            </ShuffledWordWrapper>
            <Button
              onPress={this.handlePassedValidation}
              title={t('button.next')}
              disabled={!isFormValid}
            />
          </FooterWrapper>
        )}
      >
        <ScrollWrapper
          regularPadding
          contentContainerStyle={{ paddingTop: spacing.mediumLarge }}
        >
          <Paragraph>
            {t('paragraph.backupPhraseVerificationInstructions')}
          </Paragraph>
          <WordInputFields>
            {this.renderInputFields()}
          </WordInputFields>
          {enteredWords.length === 3 && !isFormValid &&
          <ErrorParagraph small>
            {t('error.incorrectBackupPhraseWordsSelected')}
          </ErrorParagraph>
          }
        </ScrollWrapper>
      </ContainerWithHeader>
    );
  }
}

const mapStateToProps = ({ wallet }: RootReducerState): $Shape<Props> => ({ wallet });
const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  backupWallet: () => dispatch(backupWalletAction()),
});

export default withTheme(connect(mapStateToProps, mapDispatchToProps)(BackupPhraseValidate));
