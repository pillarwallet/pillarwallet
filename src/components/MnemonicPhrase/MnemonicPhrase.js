// @flow
import * as React from 'react';
import styled from 'styled-components/native';
import { Label, BaseText, BoldText } from 'components/Typography';
import { UIColors, baseColors, fontSizes } from 'utils/variables';

const MnemonicPhraseWrapper = styled.View`
  flex-direction: row;
  justify-content: space-around;
  flex-wrap: wrap;
  margin: 20px 0;
  width: 100%;
`;

const Column = styled.View`
  flex-direction: column;
  justify-content: space-around;
  flex-wrap: wrap;
  width: 50%;
`;

const MnemonicPhraseItem = styled.View`
  width: 100%;
  margin: 0 0 5px 0;
  padding-right: 10px;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
`;

const MnemonicPhraseIndex = styled(BaseText)`
  flex: 0 0 30px;
`;

const MnemonicPhraseWord = styled(BoldText)`
  background-color: ${baseColors.lightGray};
  font-size: ${fontSizes.extraSmall};
  flex: 1;
  border-color: ${UIColors.defaultBorderColor};
  border-style: dashed;
  border-width: 1;
  border-radius: 6;
  padding: 5px;
`;

type Props = {
  phrase: string,
};

const MnemonicPhrase = (props: Props) => {
  const { phrase } = props;
  const mnemonicList = phrase.split(' ');
  const mnemonic1to6 = mnemonicList.slice(0, 6);
  const mnemonic7to12 = mnemonicList.slice(6, 12);

  return (
    <MnemonicPhraseWrapper>
      <Column>
        {
          mnemonic1to6.map((word, index) => (
            <MnemonicPhraseItem key={`${word}+${index}`}>
              <MnemonicPhraseIndex><Label>{index + 1}</Label></MnemonicPhraseIndex>
              <MnemonicPhraseWord>{word}</MnemonicPhraseWord>
            </MnemonicPhraseItem>
            ),
          )
        }
      </Column>
      <Column>
        {
          mnemonic7to12.map((word, index) => (
            <MnemonicPhraseItem key={`${word}+${index}`}>
              <MnemonicPhraseIndex><Label>{index + 7}</Label></MnemonicPhraseIndex>
              <MnemonicPhraseWord>{word}</MnemonicPhraseWord>
            </MnemonicPhraseItem>
            ),
          )
        }
      </Column>
    </MnemonicPhraseWrapper>
  );
};

export default MnemonicPhrase;
