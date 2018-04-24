// @flow
import * as React from 'react';
import styled from 'styled-components/native';

const MnemonicPhraseWrapper = styled.View`
  margin-top: 20;
  margin-bottom: 20;
  padding: 20px;
  background-color: #f2f2f2;
  flex-wrap: wrap;
  flex-direction: row;
  border-color: #d6d7da;
  border-style: dashed;
  border-width: 1;
  border-radius: 4;
`;

const MnemonicPhraseItem = styled.Text`
  font-weight: bold;
  margin-right: 10;
  margin-bottom: 2;
  font-size: 12px;
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
        mnemonicList.map(word => <MnemonicPhraseItem key={word}>{word}</MnemonicPhraseItem>)
      }
    </MnemonicPhraseWrapper>
  );
};

export default MnemonicPhrase;
