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

// components
import { BaseText } from 'components/legacy/Typography';

// constants
import { CHAIN } from 'constants/chainConstants';
import { ADDRESS_ZERO } from 'constants/assetsConstants';

// local
import Table, { TableRow, TableLabel, TableAmount, TableTotal } from './Table';
import WithThemeDecorator from '../../../../storybook/WithThemeDecorator';
import CenterViewDecorator from '../../../../storybook/CenterViewDecorator';


storiesOf('Table', module)
  .addDecorator(CenterViewDecorator)
  .addDecorator(WithThemeDecorator)
  .add('default', () => (
    <Table title="Table">
      <TableRow>
        <TableLabel>One</TableLabel>
        <TableAmount amount={12320.56} assetSymbol="PLR" assetAddress="0x" chain={CHAIN.ETHEREUM} />
      </TableRow>
      <TableRow>
        <TableLabel>Two</TableLabel>
        <BaseText big positive>Some weird component</BaseText>
      </TableRow>
      <BaseText large negative>Even weirder component</BaseText>
      <TableRow>
        <TableLabel>Free</TableLabel>
        <TableAmount amount={0} assetSymbol="ETH" assetAddress={ADDRESS_ZERO} chain={CHAIN.ETHEREUM} />
      </TableRow>
      <TableRow>
        <TableLabel>High fees</TableLabel>
        <TableAmount amount={12320.56} assetSymbol="PLR" assetAddress="0x" chain={CHAIN.ETHEREUM} highFees />
      </TableRow>
      <TableRow>
        <TableTotal>Total</TableTotal>
        <TableAmount amount={12320.56} assetSymbol="PLR" assetAddress="0x" chain={CHAIN.ETHEREUM} />
      </TableRow>
    </Table>
  ));
