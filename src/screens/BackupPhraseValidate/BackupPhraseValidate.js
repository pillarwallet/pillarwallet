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
import { Platform } from 'react-native';
import { UIColors, fontSizes } from 'utils/variables';
import styled from 'styled-components/native';
import { Container, Wrapper, Footer } from 'components/Layout';
import { Paragraph, Label, BoldText } from 'components/Typography';
import Button from 'components/Button';
import Header from 'components/Header';
import IconButton from 'components/IconButton';
import { LEGAL_TERMS, PROFILE } from 'constants/navigationConstants';
import { backupWalletAction } from 'actions/walletActions';

type State = {
  enteredWords: string[],
  isFormValid: boolean,
};

type Props = {
  wallet: Object,
  navigation: NavigationScreenProp<*>,
  backupWallet: Function,
};

const WordInputFields = styled.View`
  margin: 20px 0;
`;

const MnemonicPhraseWord = styled.TouchableHighlight`
  background-color: ${props => (props.entered ? UIColors.disabled : UIColors.primary)};
  border-radius: 6;
  padding: 14px 5px;
  margin: 0 2.5px 5px;
`;

const MnemonicPhraseWordText = styled(BoldText)`
  font-size: ${fontSizes.extraSmall};
  color: #ffffff;
`;

const WordInputWrapper = styled.View`
  margin-bottom: 5px;
  flex-direction: row;
  align-items: flex-start;
  justify-content: center;
`;

const WordInput = styled.View`
  background-color: ${props => (props.filled ? UIColors.primary : 'transparent')};
  border-width: 1;
  border-style: ${props => (props.filled ? 'solid' : 'dashed')};
  border-color: ${props => (props.filled ? 'transparent' : UIColors.defaultBorderColor)};;
  border-radius: 6px;
  height: 34px;
  flex: 1;
  justify-content: center;
`;

const WordInputPrefix = styled.View`
  flex: 0 0 24px;
  height: 40px;
  justify-content: center;
  align-items: flex-start;
`;

const WordInputNumber = styled(Label)`
  line-height: 40px;
`;

const RemoveWordButtonIcon = styled(IconButton)`
  height: 42px;
  margin-left: ${Platform.OS === 'ios' ? '14px' : '6px'};
  margin-top: ${Platform.OS === 'ios' ? 0 : '-4px'};
  margin-right: ${Platform.OS === 'ios' ? 0 : '-6px'};
`;

const WordInputText = styled(BoldText)`
  font-size: ${fontSizes.small};
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

class BackupPhraseValidate extends React.Component<Props, State> {
  state = {
    enteredWords: [],
    isFormValid: false,
  };

  handleWordSetting = (word) => {
    let { enteredWords } = this.state;
    const { onboarding: wallet } = this.props.wallet;
    const maxWords = wallet.mnemonic.wordsToValidate.length;
    if (enteredWords.length === maxWords) return;
    enteredWords = [...enteredWords, word];

    this.setState({
      enteredWords,
    }, () => {
      const isFormValid = this.validateForm(this.state.enteredWords);
      this.setState({
        isFormValid,
      });
    });
  };

  handleLastWordRemoval = () => {
    let { enteredWords } = this.state;
    enteredWords = [...enteredWords.slice(0, -1)];

    this.setState({
      enteredWords,
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
    const { onboarding: wallet } = this.props.wallet;
    const { wordsToValidate } = wallet.mnemonic;
    const { enteredWords } = this.state;
    const mnemonicList = wallet.mnemonic.original.split(' ');

    return [...Array(wordsToValidate.length)]
      .map((el, i) => {
        return (
          <WordInputWrapper key={mnemonicList[i]}>
            <WordInputPrefix><WordInputNumber>{wordsToValidate[i]}</WordInputNumber></WordInputPrefix>
            <WordInput filled={!!enteredWords[i]}>
              <WordInputText>{enteredWords[i] || ''}</WordInputText>
            </WordInput>
            {enteredWords.length === (i + 1) &&
              <RemoveWordButtonIcon
                icon="close"
                onPress={this.handleLastWordRemoval}
                fontSize={fontSizes.small}
                color={UIColors.primary}
              />
            }
          </WordInputWrapper>
        );
      });
  };

  renderShuffledWordList = () => {
    const { onboarding: wallet } = this.props.wallet;
    const { enteredWords } = this.state;
    const shuffledMnemonicList = wallet.mnemonic.shuffled.split(' ');

    return shuffledMnemonicList.map((word: string, index: number) => {
      const isEntered = enteredWords.indexOf(word) > -1;
      return (
        <MnemonicPhraseWord
          key={`${word}${index}`}
          onPress={() => this.handleWordSetting(word)}
          entered={isEntered}
        >
          <MnemonicPhraseWordText>{word}</MnemonicPhraseWordText>
        </MnemonicPhraseWord>
      );
    });
  };

  handlePassedValidation = () => {
    const { navigation, backupWallet } = this.props;
    backupWallet();
    if (navigation.getParam('backupViaSettings', false)) {
      navigation.navigate(PROFILE);
    } else {
      navigation.navigate(LEGAL_TERMS);
    }
  };

  render() {
    const { onboarding: wallet } = this.props.wallet;
    const { isFormValid } = this.state;
    if (!wallet.mnemonic.original) return null;

    return (
      <Container>
        <Header title="verify backup phrase" onBack={() => this.props.navigation.goBack(null)} />
        <Wrapper regularPadding>
          <Paragraph>
            Please select the correct words.
          </Paragraph>
          <WordInputFields>
            {this.renderInputFields()}
          </WordInputFields>
        </Wrapper>
        <Footer>
          <ShuffledWordWrapper>
            {this.renderShuffledWordList()}
            {!!__DEV__ && (
            <MnemonicPhraseWord
              key="automagical"
              onPress={this.handlePassedValidation}
            >
              <MnemonicPhraseWordText>debugskip</MnemonicPhraseWordText>
            </MnemonicPhraseWord>
            )}
          </ShuffledWordWrapper>
          <Button
            onPress={this.handlePassedValidation}
            title="Next"
            disabled={!isFormValid}
          />
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });
const mapDispatchToProps = (dispatch: Function) => ({
  backupWallet: () => dispatch(backupWalletAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(BackupPhraseValidate);
