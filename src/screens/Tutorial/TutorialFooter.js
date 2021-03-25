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

import React from 'react';
import { TouchableOpacity } from 'react-native';
import t from 'translations/translate';

import styled, { withTheme } from 'styled-components/native';
import { BaseText } from 'components/Typography';
import { fontStyles } from 'utils/variables';
import { hitSlop10 } from 'utils/common';

import type { Theme } from 'models/Theme';

const Wrapper = styled.View`
  height: 50px;
  padding: 0px 20px;
  width: 100%;
  bottom: 0;
  border-top-width: 1px;
  border-color: green;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const ButtonText = styled(BaseText)`
  ${fontStyles.medium};
`;

type Props = {
  onSkipPress: (() => void),
  onBackPress: ?() => void,
  onNextPress: ?(() => void),
  isLast: boolean,
  theme: Theme,
}
export default withTheme(({
  onBackPress, onNextPress, onSkipPress, isLast,
}: Props) => {
  const renderButton = (title: string, handler: ?Function) => (
    <TouchableOpacity disabled={!handler} onPress={handler} hitSlop={hitSlop10}>
      <ButtonText>{handler ? title : ''}</ButtonText>
    </TouchableOpacity>
  );

  return (
    <Wrapper>
      {renderButton(t('button.back'), onBackPress)}
      {renderButton(t('button.skip'), onSkipPress)}
      {renderButton(t(`button.${isLast ? 'finish' : 'next'}`), onNextPress)}
    </Wrapper>
  );
});
