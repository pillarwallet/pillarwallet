// @flow
import * as React from 'react';
import { connect } from 'react-redux';
import type { NavigationScreenProp } from 'react-navigation';

import { Text, View } from 'react-native';
import Container from 'components/Container';
import Wrapper from 'components/Wrapper';
import { Title, Label } from 'components/Typography';
import Button from 'components/Button';
import Divider from 'components/Divider';
import MultiButtonWrapper from 'components/MultiButtonWrapper';
import FakeInput from 'components/FakeInput';
import InputGroup from 'components/InputGroup';
import { SET_WALLET_PIN_CODE } from 'constants/navigationConstants';

type State = {
  isFormValid: boolean,
  enteredWords: string[],
};

type Props = {
  wallet: Object,
  navigation: NavigationScreenProp<*>,
};

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

  render() {
    const { onboarding: wallet } = this.props.wallet;
    const { isFormValid, enteredWords } = this.state;

    if (!wallet.mnemonic.original) return null;
    const { wordsToValidate } = wallet.mnemonic;
    const mnemonicList = wallet.mnemonic.original.split(' ');
    const shuffledMnemonicList = wallet.mnemonic.shuffled.split(' ');

    const shuffledWordList = shuffledMnemonicList.map((word: string) => (
      <Button
        small
        width="90"
        style={{ margin: 10 }}
        key={word}
        light
        onPress={() => this.setWord(word)}
        title={word}
        marginBottom
      />
    ));

    const inputFields = Array(wordsToValidate.length).fill('')
      .map((el, i) => {
        return (
          <View key={mnemonicList[i]}>
            <Label>Word #{wordsToValidate[i]}:</Label>
            <FakeInput>{enteredWords[i] || ''}</FakeInput>
          </View>
        );
      });

    return (
      <Container>
        <Wrapper padding>
          <Title>Backup Test</Title>
          <Text style={{ color: 'grey' }}>
            Please select the appropriate words from the list
          </Text>

          <InputGroup style={{ paddingTop: 30 }}>
            {inputFields}
          </InputGroup>

          <Text style={{ paddingBottom: 15 }}>12-word phrase</Text>
          <View style={{
            flexWrap: 'wrap',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center',
            }}
          >
            {shuffledWordList}
          </View>
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
