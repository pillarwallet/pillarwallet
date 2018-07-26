// @flow
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
import ButtonIcon from 'components/ButtonIcon';
import { SET_WALLET_PIN_CODE } from 'constants/navigationConstants';

type State = {
  enteredWords: string[],
  isFormValid: boolean,
};

type Props = {
  wallet: Object,
  navigation: NavigationScreenProp<*>,
};

const WordInputFields = styled.View`
  margin-top: 20px;
`;

const MnemonicPhraseWord = styled.TouchableHighlight`
  background-color: ${props => (props.entered ? UIColors.disabled : UIColors.primary)};
  border-radius: 6;
  padding: 10px;
  margin: 5px;
`;

const MnemonicPhraseWordText = styled(BoldText)`
  font-size: ${fontSizes.extraSmall};
  color: #ffffff;
`;

const WordInputWrapper = styled.View`
  margin: 0 0 20px;
  flex-direction: row;
  align-items: flex-start;
`;

const WordInput = styled.View`
  background-color: ${props => (props.filled ? UIColors.primary : 'transparent')};
  border-width: 1;
  border-style: ${props => (props.filled ? 'solid' : 'dashed')};
  border-color: ${props => (props.filled ? 'transparent' : UIColors.defaultBorderColor)};;
  border-radius: 6px;
  padding: 10px;
  height: 42px;
  flex: 1;
`;

const WordInputPrefix = styled.View`
  flex: 0 0 20px;
  height: 42px;
  justify-content: center;
  align-items: flex-start;
`;

const WordInputNumber = styled(Label)`
  line-height: 42px;
`;

const RemoveWordButtonIcon = styled(ButtonIcon)`
  height: 42px;
  margin-left: ${Platform.OS === 'ios' ? '14px' : '6px'};
  margin-top: ${Platform.OS === 'ios' ? 0 : '-4px'};
  margin-right: ${Platform.OS === 'ios' ? 0 : '-6px'};
`;

const WordInputText = styled(BoldText)`
  font-size: 14px;
  color: white;
`;

const ShuffledWordWrapper = styled.View`
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: center;
  align-items: center;
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
                fontSize={fontSizes.extraExtraLarge}
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

  render() {
    const { onboarding: wallet } = this.props.wallet;
    const { isFormValid } = this.state;
    if (!wallet.mnemonic.original) return null;

    return (
      <Container>
        <Header title="verify backup phrase" onBack={() => this.props.navigation.goBack(null)} />
        <Wrapper regularPadding>
          <Paragraph>
            Please select the appropriate words from the list.
          </Paragraph>
          <WordInputFields>
            {this.renderInputFields()}
          </WordInputFields>
          <ShuffledWordWrapper>
            {this.renderShuffledWordList()}
            {!!__DEV__ && (
            <MnemonicPhraseWord
              key="automagical"
              onPress={() => this.props.navigation.navigate(SET_WALLET_PIN_CODE)}
            >
              <MnemonicPhraseWordText>debugskip</MnemonicPhraseWordText>
            </MnemonicPhraseWord>
            )}
          </ShuffledWordWrapper>
        </Wrapper>
        <Footer>
          <Button
            block
            onPress={() => this.props.navigation.navigate(SET_WALLET_PIN_CODE)}
            title="Next"
            disabled={!isFormValid}
          />
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

export default connect(mapStateToProps)(BackupPhraseValidate);
