// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import styled from 'styled-components/native';
import { Footer, Container, Wrapper } from 'components/Layout';
import { Paragraph, Label } from 'components/Typography';
import Title from 'components/Title';
import ButtonIcon from 'components/ButtonIcon';
import Button from 'components/Button';
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
  margin: 20px 0 0;
`;

const MnemonicPhraseWord = styled.TouchableHighlight`
  background-color: ${props => (props.entered ? 'grey' : '#2077fd')};
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
  margin: 0 0 10px;
  flex-direction: row;
  align-items: flex-start;
`;

const WordInput = styled.View`
  background-color: ${props => (props.filled ? '#2077fd' : 'transparent')};
  border-width: ${props => (props.filled ? '0' : '1')};
  border-style: ${props => (props.filled ? 'solid' : 'dashed')};
  border-color: ${props => (props.filled ? 'transparent' : 'grey')};;
  border-radius: 6px;
  padding: 10px;
  height: 42px;
  flex: 1;
`;

const WordInputPrefix = styled.View`
  flex: 0 0 30px;
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
  color: white;
`;

const ShuffledWordWrapper = styled.View`
  flex-wrap: wrap;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  margin: 20px 0;
`;

class BackupPhraseValidate extends React.Component<Props, State> {
  state = {
    isFormValid: false,
    enteredWords: [],
  };

  handleWordSetting = (word) => {
    let { enteredWords } = this.state;
    const { onboarding: wallet } = this.props.wallet;
    const maxWords = wallet.mnemonic.wordsToValidate.length;
    if (enteredWords.length === maxWords) return;
    enteredWords = [...enteredWords, word];

    const isFormValid = this.validateForm(enteredWords);

    this.setState({
      enteredWords,
      isFormValid,
    });
  }

  handleLastWordRemoval = () => {
    let { enteredWords } = this.state;
    enteredWords = [...enteredWords.slice(0, -1)];

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
              <ButtonIcon icon="close" onPress={this.handleLastWordRemoval} fontSize={27} />
            }
          </WordInputWrapper>
        );
      });
  }

  renderShuffledWordList = () => {
    const { onboarding: wallet } = this.props.wallet;
    const { enteredWords } = this.state;
    const shuffledMnemonicList = wallet.mnemonic.shuffled.split(' ');

    return shuffledMnemonicList.map((word: string) => {
      const isEntered = enteredWords.indexOf(word) > -1;
      return (
        <MnemonicPhraseWord
          key={word}
          onPress={() => this.handleWordSetting(word)}
          entered={isEntered}
        >
          <MnemonicPhraseWordText>{word}</MnemonicPhraseWordText>
        </MnemonicPhraseWord>
      );
    });
  }

  render() {
    const { onboarding: wallet } = this.props.wallet;
    const { isFormValid } = this.state;
    if (!wallet.mnemonic.original) return null;

    return (
      <Container>
        <Wrapper padding>
          <Title title="verify passphrase" />
          <Paragraph>
            Please select the appropriate words from the list
          </Paragraph>
          <WordInputFields>
            {this.renderInputFields()}
          </WordInputFields>
          <ShuffledWordWrapper>
            {this.renderShuffledWordList()}
          </ShuffledWordWrapper>

        </Wrapper>
        <Footer>
          <Button
            block
            marginBottom="20px"
            title="Debug skip"
            onPress={this.goToNextScreen}
          />
          <Button
            block
            marginBottom="20px"
            title="Next"
            onPress={this.goToNextScreen}
            disabled={!isFormValid}
          />
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

export default connect(mapStateToProps)(BackupPhraseValidate);
