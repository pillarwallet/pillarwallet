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
import { format as formatDate } from 'date-fns';

import { MediumText } from 'components/legacy/Typography';
import { getColorByTheme } from 'utils/themes';


type Props = {
  value: ?Date,
  onPress?: () => void,
  filled?: boolean,
};

const TextInputWrapper = styled.TouchableOpacity`
  background-color: ${getColorByTheme({ lightKey: 'basic060', darkKey: 'basic080' })};
  padding: 13px 16px;
  border-radius: 6px;
  flex-direction: row;
  justify-content: space-between;
  min-height: 56px;
`;

const TimingInput = ({ value, onPress, filled }: Props) => {
  const dateString = value && formatDate(value, 'ddd, D MMMM');
  const hourString = value && formatDate(value, 'H:mm');
  return (
    <TextInputWrapper onPress={onPress} filled={filled} >
      <MediumText big>{dateString}</MediumText>
      <MediumText big>{hourString}</MediumText>
    </TextInputWrapper>
  );
};

export default TimingInput;
