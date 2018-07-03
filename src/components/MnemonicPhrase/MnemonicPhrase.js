// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Label } from 'components/Typography';
import { UIColors, baseColors, fontSizes } from 'utils/variables';

const MnemonicPhraseWrapper = styled.View`
  flex-direction: column;
  justify-content: space-around;
  flex-wrap: wrap;
  height: 280px;
  margin: 20px 0;
  width: 100%;
`;

const MnemonicPhraseItem = styled.View`
  width: 50%;
  margin: 0 0 5px 0;
  padding-right: 10px;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
`;

const MnemonicPhraseIndex = styled.Text`
  flex: 0 0 20px;
`;

const MnemonicPhraseWord = styled.Text`
  background-color: ${baseColors.lightGray};
  font-weight: bold;
  font-size: ${fontSizes.extraSmall};
  flex: 1;
  border-color: ${UIColors.defaultBorderColor};
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
