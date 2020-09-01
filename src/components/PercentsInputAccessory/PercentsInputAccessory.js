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
import { TouchableOpacity } from 'react-native';
import styled from 'styled-components/native';
import { themedColors } from 'utils/themes';
import { BaseText } from 'components/Typography';


type Props = {
  handleUsePercent: (number) => void,
};

const PERCENTS = [10, 25, 50, 75, 100];

const AccessoryContentWrapper = styled.View`
  flex-direction: row;
  justify-content: space-around;
  padding: 10px 0;
  background-color: ${themedColors.card};
  border-top-width: 1px;
  border-color: ${themedColors.tertiary};
`;

const PercentsInputAccessory = ({ handleUsePercent }: Props) => {
  return (
    <AccessoryContentWrapper>
      {PERCENTS.map(percent => (
        <TouchableOpacity onPress={() => handleUsePercent(percent)} key={percent}>
          <BaseText>{percent}%</BaseText>
        </TouchableOpacity>
      ))}
    </AccessoryContentWrapper>
  );
};

export default PercentsInputAccessory;
