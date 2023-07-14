// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import * as React from 'react';
import styled from 'styled-components/native';

// Components
import Text from 'components/core/Text';

// Utils
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

const getIndex = (number: number) => {
  return `0${number}`.slice(-2);
};

type Props = {
  phrase: string,
};

const MnemonicPhrase = (props: Props) => {
  const { phrase } = props;
  const mnemonicList = phrase.split(' ');
  const colors = useThemeColors();

  return (
    <MnemonicPhraseWrapper>
      <List
        data={mnemonicList}
        bounces={false}
        numColumns={3}
        scrollEnabled={false}
        renderItem={({ index }) => {
          return (
            <MnemonicPhraseItem key={`${mnemonicList[index]}+${index}`}>
              <Index color={colors.secondaryText} variant="small">
                {getIndex(index + 1)}
              </Index>
              <Word variant="medium">{mnemonicList[index]}</Word>
            </MnemonicPhraseItem>
          );
        }}
      />
    </MnemonicPhraseWrapper>
  );
};

export default MnemonicPhrase;

const MnemonicPhraseWrapper = styled.View`
  width: 100%;
  flex-wrap: wrap;
  align-content: center;
  margin: ${spacing.largePlus}px 0px;
`;

const MnemonicPhraseItem = styled.View`
  width: 33.3%;
  flex-direction: row;
  align-items: center;
  padding-right: 5px;
  margin-bottom: ${spacing.small}px;
`;

const List = styled.FlatList``;

const Index = styled(Text)`
  width: 15%;
  text-align: right;
`;

const Word = styled(Text)`
  width: 80%;
  margin-left: ${spacing.small}px;
`;
