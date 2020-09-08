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
import { storiesOf } from '@storybook/react-native';
import styled from 'styled-components/native';
import { BaseText } from 'components/Typography';
import Table, { TableRow, TableLabel, TableAmount } from './Table';

const Wrapper = styled.View`
  padding: 30px;
  justify-content: center;
`;

storiesOf('Table', module).add('default', () => (
  <Wrapper>
    <Table>
      <TableRow>
        <TableLabel>One</TableLabel>
        <TableAmount amount="12,320.56 PLR" fiatAmount="$262.45" />
      </TableRow>
      <TableRow>
        <TableLabel>Two</TableLabel>
        <BaseText big positive>Some weird component</BaseText>
      </TableRow>
      <BaseText large negative>Even weirder component</BaseText>
    </Table>
  </Wrapper>
));
