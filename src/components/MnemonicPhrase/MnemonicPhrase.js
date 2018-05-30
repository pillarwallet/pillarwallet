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
  width: 100%;
`;

const MnemonicPhraseItem = styled.View`
  width: 40%;
  margin: 0 5% 5px;
  flex-direction: row;
  align-items: center;
  align-content: center;
  justify-content: space-around;
`;

const MnemonicPhraseIndex = styled.Text`
  margin-right: 30px;
`;

const MnemonicPhraseWord = styled.Text`
  background-color: ${baseColors.lightGray};
  font-weight: bold;
  font-size: ${fontSizes.small};
  width: 100%;
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
          <MnemonicPhraseItem key={word}>
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
