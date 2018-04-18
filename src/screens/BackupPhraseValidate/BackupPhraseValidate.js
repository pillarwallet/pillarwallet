// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';
import shuffle from 'shuffle-array';

import { Text, View } from 'react-native';
import Container from 'components/Container';
import Footer from 'components/Footer';
import Title from 'components/Title';
import Button from 'components/Button';
import FakeInput from 'components/FakeInput';
import InputGroup from 'components/InputGroup';
import Label from 'components/Label';

import { getRandomInt } from 'utils/common';
import { generateWalletMnemonicAction } from 'actions/walletActions';
import { ENCODE_WALLET_PIN_CODE } from 'constants/navigationConstants';

const NUM_WORDS_TO_CHECK = 3;

type State = {
  isFormValid: boolean,
  enteredWords: string[],
};

type Props = {
  wallet: Object,
  navigation: NavigationScreenProp<*>,
};

class BackupPhraseValidate extends React.Component<Props, State> {
  wordsToValidate: number[] = [];
  mnemonicList: string[] = [];
  shuffledMnemonicList: string[] = [];

  constructor(props: Props) {
    super(props);

    this.state = {
      isFormValid: false,
      enteredWords: [],
    };

    const { data: wallet } = props.wallet;
    if (!wallet.mnemonic) return;

    if (!this.wordsToValidate.length) {
      this.mnemonicList = wallet.mnemonic.split(' ');
      this.shuffledMnemonicList = shuffle(this.mnemonicList, { copy: true });
      this.wordsToValidate = this.chooseWordsToValidate();
    }
  }

  setWord(word) {
    let { enteredWords } = this.state;
    if (enteredWords.length < NUM_WORDS_TO_CHECK) {
      enteredWords = [...enteredWords, word];
    } else {
      enteredWords[NUM_WORDS_TO_CHECK - 1] = word;
    }
    const isFormValid = this.validateForm(enteredWords);

    this.setState({
      enteredWords,
      isFormValid,
    });
  }

  validateForm(enteredWords) {
    if (enteredWords.length !== NUM_WORDS_TO_CHECK) return false;

    let isFormValid = true;
    enteredWords.forEach((enteredWord, i) => {
      const rightWordIndex = this.wordsToValidate[i] - 1;
      const rightWord = this.mnemonicList[rightWordIndex];

      if (rightWord !== enteredWord) isFormValid = false;
    });
    return isFormValid;
  }

  createListItem(i: number, list: string[]) {
    return (
      <Button
        width="100%"
        key={i + list[i]}
        light
        onPress={() => this.setWord(list[i])}
        title={list[i]}
      />
    );
  }

  chooseWordsToValidate() {
    const chosenWords = [];
    while (chosenWords.length < NUM_WORDS_TO_CHECK) {
      const randomNumber = getRandomInt(1, 12);
      if (chosenWords.includes(randomNumber)) continue; // eslint-disable-line
      chosenWords.push(randomNumber);
    }
    chosenWords.sort((a, b) => a - b);
    return chosenWords;
  }

  goToNextScreen = () => {
    this.props.navigation.navigate(ENCODE_WALLET_PIN_CODE);
  };

  render() {
    const { data: wallet } = this.props.wallet;
    const { isFormValid, enteredWords } = this.state;

    if (!wallet.mnemonic) return null;

    const wordList = this.mnemonicList
      .map((num, i) => this.createListItem(i, this.mnemonicList));

    const shuffledWordList = this.shuffledMnemonicList
      .map((num, i) => this.createListItem(i, this.shuffledMnemonicList));

    const inputFields = Array(NUM_WORDS_TO_CHECK).fill('')
      .map((el, i) => {
        return (
          <View key={this.mnemonicList[i]}>
            <Label>Word #{this.wordsToValidate[i]}:</Label>
            <FakeInput>{enteredWords[i] || ''}</FakeInput>
          </View>
        );
      });

    return (
      <Container>
        <Title>Backup Test</Title>
        <Text style={{ color: 'grey' }}>
          Please select the appropriate words from the list
        </Text>

        <InputGroup style={{ paddingTop: 30 }}>
          {inputFields}
        </InputGroup>

        <Text>Original</Text>
        <Text>{wordList}</Text>

        <Text>Shuffled</Text>
        <Text>{shuffledWordList}</Text>

        <Button title="Debug skip" onPress={this.goToNextScreen} width="100%" />
        <Footer>
          <Button title="Next" onPress={this.goToNextScreen} disabled={!isFormValid} />
        </Footer>
      </Container>
    );
  }
}

const mapStateToProps = ({ wallet }) => ({ wallet });

const mapDispatchToProps = (dispatch: Function) => ({
  generateWalletMnemonic: () => {
    dispatch(generateWalletMnemonicAction());
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(BackupPhraseValidate);
