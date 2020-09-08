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
import { themedColors } from 'utils/themes';
import { fontStyles } from 'utils/variables';
import { BaseText } from 'components/Typography';
import { Spacing } from 'components/Layout';


type TableAmountProps = {
  amount: string,
  fiatAmount: string,
};

type TableProps = {
  children?: React.Node
};

const TableContainer = styled.View`
  border-color: ${themedColors.tertiary};
  border-width: 1px;
  border-radius: 4px;
`;

export const TableRow = styled.View`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  padding: 10px 20px;
`;

export const TableLabel = styled(BaseText)`
  ${fontStyles.regular};
  color: ${themedColors.secondaryText};
`;

const Divider = styled.View`
  height: 1px;
  width: 100%;
  background-color: ${themedColors.tertiary};
`;

const AmountContainer = styled.View`
  flex-direction: row;
`;

export const TableAmount = ({ amount, fiatAmount }: TableAmountProps) => {
  return (
    <AmountContainer>
      <BaseText regular>{amount}</BaseText>
      <Spacing w={4} />
      <BaseText regular secondary>{fiatAmount}</BaseText>
    </AmountContainer>
  );
};

const Table = ({ children }: TableProps) => {
  return (
    <TableContainer>
      {React.Children.map(children, (child, index) => {
        return (
          <>
            {index > 0 && <Divider />}
            {child}
          </>
        );
      })}
    </TableContainer>
  );
};

export default Table;
