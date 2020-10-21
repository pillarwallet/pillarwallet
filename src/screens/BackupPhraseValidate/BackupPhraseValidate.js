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
import React, { useEffect, useState } from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import t from 'translations/translate';
import styled, { withTheme } from 'styled-components/native';
import shuffle from 'shuffle-array';

// actions
import { backupWalletAction } from 'actions/walletActions';

// utils
import { fontSizes, spacing } from 'utils/variables';
import { getThemeColors, themedColors } from 'utils/themes';
import { generateWordsToValidate } from 'utils/wallet';
import { reportErrorLog } from 'utils/common';

// components
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import { ScrollWrapper } from 'components/Layout';
import { Paragraph, Label, MediumText } from 'components/Typography';
import Button from 'components/Button';
import IconButton from 'components/IconButton';

// types
import type { Dispatch } from 'reducers/rootReducer';
import type { Theme } from 'models/Theme';


type Props = {
  navigation: NavigationScreenProp<*>,
  backupWallet: () => void,
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
  background-color: ${({ theme }) => theme.colors.basic070};
`;

const DEBUG_SKIP = 'debugskip';
const NUM_WORDS_TO_CHECK = 3;

const BackupPhraseValidate = ({
  navigation,
  theme,
  backupWallet,
}: Props) => {
  const mnemonicPhrase = navigation.getParam('mnemonicPhrase', null);
  if (!mnemonicPhrase) {
    // some edge case caused fail, report and navigate back;
    navigation.dismiss();
    reportErrorLog('BackupPhraseValidate screen has no mnemonicPhrase!');
    return null;
  }

  const mnemonicWords = mnemonicPhrase.split(' ');

  const [wordsToValidate, setWordsToValidate] = useState(null);
  const [shuffledPhrase, setShuffledPhrase] = useState(null);

  // shuffles on initial render
  useEffect(() => {
    setShuffledPhrase(shuffle(mnemonicWords, { copy: true }).join(' '));
    setWordsToValidate(generateWordsToValidate(NUM_WORDS_TO_CHECK, mnemonicWords.length));
  }, []);

  const [enteredWords, setEnteredWords] = useState([]);
  const [isFormValid, setIsFormValid] = useState(false);

  const validateForm = () => {
    if (!wordsToValidate) {
      if (isFormValid) setIsFormValid(false);
      return;
    }

    const maxWords = wordsToValidate.length;

    if (enteredWords.length !== maxWords) {
      if (isFormValid) setIsFormValid(false);
      return;
    }

    const validPhrase = wordsToValidate.map((wordIndex) => mnemonicWords[wordIndex - 1]);

    setIsFormValid(validPhrase.toString() === enteredWords.toString());
  };

  useEffect(() => { validateForm(); }, [enteredWords]);

  const handleWordSetting = (word) => {
    const maxWords = wordsToValidate?.length || 0;
    if (enteredWords.length === maxWords) return;
    setEnteredWords([...enteredWords, word]);
  };

  const handleLastWordRemoval = () => setEnteredWords([...enteredWords.slice(0, -1)]);

  const colors = getThemeColors(theme);

  const renderInputFields = () => !wordsToValidate
    ? null
    : [...Array(wordsToValidate.length)].map((el, i) => (
      <WordInputWrapper key={`${mnemonicWords[i]}_${i}`}>
        <WordInputPrefix><Label>{wordsToValidate[i]}</Label></WordInputPrefix>
        <WordInput filled={!!enteredWords[i]}>
          <WordInputText>{enteredWords[i] || ''}</WordInputText>
        </WordInput>
        {enteredWords.length === (i + 1) && (
          <RemoveWordButtonIcon
            icon="close"
            onPress={handleLastWordRemoval}
            fontSize={fontSizes.medium}
            color={colors.primary}
          />
        )}
      </WordInputWrapper>
    ));

  const renderShuffledWordList = () => !shuffledPhrase
    ? null
    : shuffledPhrase.split(' ').map((word: string, index: number) => (
      <MnemonicPhraseWord
        key={`${word}${index}`}
        onPress={() => handleWordSetting(word)}
        disabled={enteredWords.includes(word)}
      >
        <MnemonicPhraseWordText>{word}</MnemonicPhraseWordText>
      </MnemonicPhraseWord>
    ));

  const handlePassedValidation = () => {
    backupWallet();
    navigation.dismiss();
  };

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: t('title.verifyBackupPhrase') }] }}
      footer={(
        <FooterWrapper>
          <ShuffledWordWrapper>
            {renderShuffledWordList()}
            {!!__DEV__ && (
              <MnemonicPhraseWord
                key="automagical"
                onPress={handlePassedValidation}
              >
                <MnemonicPhraseWordText>{DEBUG_SKIP}</MnemonicPhraseWordText>
              </MnemonicPhraseWord>
            )}
          </ShuffledWordWrapper>
          <Button
            onPress={handlePassedValidation}
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
          {renderInputFields()}
        </WordInputFields>
        {enteredWords.length === 3 && !isFormValid && (
          <ErrorParagraph small>
            {t('error.incorrectBackupPhraseWordsSelected')}
          </ErrorParagraph>
        )}
      </ScrollWrapper>
    </ContainerWithHeader>
  );
};

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  backupWallet: () => dispatch(backupWalletAction()),
});

export default withTheme(connect(null, mapDispatchToProps)(BackupPhraseValidate));
