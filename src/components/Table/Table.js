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
import { View } from 'react-native';
import styled from 'styled-components/native';
import { themedColors } from 'utils/themes';
import { fontStyles } from 'utils/variables';
import { BaseText, MediumText } from 'components/Typography';
import { Spacing } from 'components/Layout';

export { default as TableAmount } from './TableAmount';


type Props = {
  children?: React.Node,
  title?: string,
};

export const TableRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
`;

export const TableLabel = styled(BaseText)`
  ${fontStyles.regular};
  color: ${themedColors.secondaryText};
`;

export const TableTotal = styled(MediumText)`
  ${fontStyles.regular};
`;

const Divider = styled.View`
  height: 1px;
  width: 100%;
  background-color: ${themedColors.tertiary};
`;

const Table = ({ children, title }: Props) => {
  return (
    <View>
      {!!title && (
        <>
          <MediumText big>{title}</MediumText>
          <Spacing h={16} />
        </>
      )}
      {React.Children.map(children, (child, index) => {
        return (
          <>
            {index > 0 && <Divider />}
            {child}
          </>
        );
      })}
    </View>
  );
};

export default Table;
