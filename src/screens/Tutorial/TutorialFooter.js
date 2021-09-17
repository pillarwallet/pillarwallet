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
import t from 'translations/translate';

import styled, { useTheme } from 'styled-components/native';
import { BaseText } from 'components/legacy/Typography';
import { fontStyles } from 'utils/variables';
import { hitSlop10 } from 'utils/common';

const Wrapper = styled.View`
  height: 50px;
  padding: 0px 20px;
  width: 100%;
  bottom: 0;
  border-top-width: 1px;
  border-color: ${({ theme }) => theme.colors.basic060};
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
`;

const Button = styled.TouchableOpacity`
  flex: 1;
  align-items: ${({ alignItems }) => alignItems};
`;

const ButtonText = styled(BaseText)`
  ${fontStyles.medium};
`;

type Props = {
  onSkipPress: (() => void),
  onBackPress: ?() => void,
  onNextPress: ?(() => void),
  isLast: boolean,
}
export default ({
  onBackPress, onNextPress, onSkipPress, isLast,
}: Props) => {
  const theme = useTheme();
  const renderButton = (title: string, handler: ?Function, alignItems: string) => (
    <Button disabled={!handler} onPress={handler} hitSlop={hitSlop10} alignItems={alignItems}>
      <ButtonText>{handler ? title : ''}</ButtonText>
    </Button>
  );

  return (
    <Wrapper theme={theme}>
      {renderButton(t('button.back'), onBackPress, 'flex-start')}
      {renderButton(isLast ? '' : t('button.skip'), onSkipPress, 'center')}
      {renderButton(t(`button.${isLast ? 'finish' : 'next'}`), onNextPress, 'flex-end')}
    </Wrapper>
  );
};
