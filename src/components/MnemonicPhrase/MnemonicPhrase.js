// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Label } from 'components/Typography';

const MnemonicPhraseWrapper = styled.View`
  flex-direction: column;
  justify-content: space-around;
  flex-wrap: wrap;
  padding-top: 20px;
  height: 350px;
  width: 100%;
`;

const MnemonicPhraseItem = styled.View`
  width: 40%;
  margin: 0 5% 10px;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: space-around;
`;

const MnemonicPhraseIndex = styled.Text`
  margin-right: 30px;
`;

const MnemonicPhraseWord = styled.Text`
  background-color: #f2f2f2;
  font-weight: bold;
  font-size: 14px;
  width: 100%;
  border-color: #d6d7da;
  border-style: dashed;
  border-width: 1;
  border-radius: 6;
  padding: 10px;
`;

type Props = {
  phrase: string,
};

const MnemonicPhrase = (props: Props) => {
  const { phrase } = props;
  const mnemonicList = phrase.split(' ');


  return (
    <MnemonicPhraseWrapper>
      {
        mnemonicList.map((word, index) => (
          <MnemonicPhraseItem key={`${word}+${index}`}>
            <MnemonicPhraseIndex><Label>{index + 1}</Label></MnemonicPhraseIndex>
            <MnemonicPhraseWord>{word}</MnemonicPhraseWord>
          </MnemonicPhraseItem>
          ),
        )
      }
    </MnemonicPhraseWrapper>
  );
};

export default MnemonicPhrase;
