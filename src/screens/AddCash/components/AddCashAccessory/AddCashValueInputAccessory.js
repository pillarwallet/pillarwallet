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
import { BaseText } from 'components/legacy/Typography';

type Props = {
  onSelectValue: (number) => mixed,
};

const VALUES = [100, 200, 500, 1000, 3000];

const AddCashValueInputAccessory = ({ onSelectValue }: Props) => {
  return (
    <AccessoryContentWrapper>
      {VALUES.map(value => (
        <TouchableOpacity onPress={() => onSelectValue(value)} key={value}>
          <BaseText>{value}</BaseText>
        </TouchableOpacity>
      ))}
    </AccessoryContentWrapper>
  );
};

export default AddCashValueInputAccessory;

const AccessoryContentWrapper = styled.View`
  flex-direction: row;
  justify-content: space-around;
  padding: 10px 0;
  background-color: ${({ theme }) => theme.colors.basic050};
  border-top-width: 1px;
  border-color: ${({ theme }) => theme.colors.basic060};
`;
