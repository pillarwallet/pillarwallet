// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { transparentize } from 'polished';
import { BaseText, BoldText } from 'components/Typography';
import { baseColors, fontSizes } from 'utils/variables';

const MnemonicPhraseWrapper = styled.View`
  flex-direction: row;
  justify-content: space-around;
  flex-wrap: wrap;
  margin: 20px 0;
  padding: 20px 10px 10px;
  width: 100%;
  background-color: ${baseColors.electricBlue};
  border-radius: 12px;
`;

const MnemonicPhraseItem = styled.View`
  width: 100%;
  padding-right: 10px;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
  margin-bottom: 10px;
`;

const MnemonicPhraseIndex = styled(BaseText)`
  flex: 0 0 30px;
  text-align: right;
  font-size: ${fontSizes.small};
  color: ${transparentize(0.5, baseColors.white)};
`;

const MnemonicPhraseWord = styled(BoldText)`
  font-size: ${fontSizes.small};
  padding-left: 10px;
  flex: 1;
  color: ${baseColors.white};

`;

const getIndex = (number: number) => {
  return (`0${number}`).slice(-2);
};

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
            <MnemonicPhraseIndex>{getIndex(index + 1)}</MnemonicPhraseIndex>
            <MnemonicPhraseWord>{word}</MnemonicPhraseWord>
          </MnemonicPhraseItem>
          ),
        )
      }
    </MnemonicPhraseWrapper>
  );
};

export default MnemonicPhrase;
