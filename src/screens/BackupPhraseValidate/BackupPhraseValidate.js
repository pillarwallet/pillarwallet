// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components';
import { Container } from 'components/Layout';
import Wrapper from 'components/Wrapper';
import { Title, Body, Label } from 'components/Typography';
import Button from 'components/Button';
import { Icon } from 'native-base';
import Divider from 'components/Divider';
import MultiButtonWrapper from 'components/MultiButtonWrapper';
import { SET_WALLET_PIN_CODE } from 'constants/navigationConstants';

type State = {
  isFormValid: boolean,
  enteredWords: string[],
};

type Props = {
  wallet: Object,
  navigation: NavigationScreenProp<*>,
};

const WordInputFields = styled.View`
  margin: 20px 0;
`;

const MnemonicPhraseWord = styled.TouchableHighlight`
  background-color: #2077fd;
  border-radius: 6;
  padding: 10px;
  margin: 5px;
`;

const MnemonicPhraseWordText = styled.Text`
  font-weight: bold;
  font-size: 14px;
  color: #ffffff;
`;

const WordInputWrapper = styled.View`
  margin: 0 0 20px;
  flex-direction: row;
  align-items: flex-start;
`;

const WordInput = styled.View`
  border-width: 1px;
  border-style: dashed;
  border-color: grey;
  border-radius: 6px;
  padding: 10px;
  height: 42px;
  flex: 1;
`;

const WordInputPrefix = styled.View`
  flex: 0 0 40px;
  text-align: right;
  height: 42px;
  justify-content: center;
  align-items: center;
`;

const WordInputPostfix = styled.View`
  flex: 0 0 40px;
  height: 42px;
  justify-content: center;
  align-items: center;
`;

const WordInputNumber = styled(Label)`
  line-height: 42px;
`;

const WordInputText = styled.Text`
  font-size: 14px;
  font-weight: bold;
`;

const ShuffledWordWrapper = styled.View`
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin: 20px;
`;

class BackupPhraseValidate extends React.Component<Props, State> {
  state = {
    isFormValid: false,
    enteredWords: [],
  };

  setWord = (word) => {
    let { enteredWords } = this.state;
    const { onboarding: wallet } = this.props.wallet;
    const maxWords = wallet.mnemonic.wordsToValidate.length;

    if (enteredWords.length < maxWords) {
      enteredWords = [...enteredWords, word];
    } else {
      enteredWords = [...enteredWords.slice(0, -1), word];
    }
    const isFormValid = this.validateForm(enteredWords);

    this.setState({
      enteredWords,
      isFormValid,
    });
  }

  removeWord(i) {
    let { enteredWords } = this.state;
    enteredWords = [...enteredWords.slice(0, i)];

    this.setState({
      enteredWords,
    });
  }

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

  goToNextScreen = () => {
    this.props.navigation.navigate(SET_WALLET_PIN_CODE);
  };

  generateEnteredWordsPhrase = () => {
    return this.state.enteredWords.join(' ');
  }

  render() {
    const { onboarding: wallet } = this.props.wallet;
    const { isFormValid, enteredWords } = this.state;

    if (!wallet.mnemonic.original) return null;
    const { wordsToValidate } = wallet.mnemonic;
    const mnemonicList = wallet.mnemonic.original.split(' ');
    const shuffledMnemonicList = wallet.mnemonic.shuffled.split(' ');

    const shuffledWordList = shuffledMnemonicList.map((word: string) => (
      <MnemonicPhraseWord
        key={word}
        onPress={() => this.setWord(word)}
      >
        <MnemonicPhraseWordText>{word}</MnemonicPhraseWordText>
      </MnemonicPhraseWord>
    ));

    const inputFields = Array(wordsToValidate.length).fill('')
      .map((el, i) => {
        return (
          <WordInputWrapper key={mnemonicList[i]}>
            <WordInputPrefix><WordInputNumber>{wordsToValidate[i]}</WordInputNumber></WordInputPrefix>
            <WordInput><WordInputText>{enteredWords[i] || ''}</WordInputText></WordInput>
            <WordInputPostfix><Icon name="close" onPress={this.removeWord(i)} /></WordInputPostfix>
          </WordInputWrapper>
        );
      });

    return (
      <Container>
        <Wrapper padding>
          <Title>verify</Title>
          <Body style={{ color: 'grey' }}>
            Please select the appropriate words from the list
          </Body>
          <WordInputFields>
            {inputFields}
          </WordInputFields>
          <ShuffledWordWrapper>
            {shuffledWordList}
          </ShuffledWordWrapper>
          <Divider />
          <MultiButtonWrapper>
            <Button marginBottom width="100%" title="Debug skip" onPress={this.goToNextScreen} />
            <Button marginBottom width="100%" title="Next" onPress={this.goToNextScreen} disabled={!isFormValid} />
          </MultiButtonWrapper>
        </Wrapper>
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

export default connect(mapStateToProps)(BackupPhraseValidate);
