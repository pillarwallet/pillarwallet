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

import { spacing } from 'utils/variables';
import { BaseText } from 'components/legacy/Typography';

import WithThemeDecorator from '../../../../storybook/WithThemeDecorator';
import { ListItemChevron } from './ListItemChevron';

const ValueText = styled(BaseText)`
  font-size: 14px;
  margin-right: ${spacing.medium}px;
`;

storiesOf('ListItemChevron', module)
  .addDecorator(WithThemeDecorator)
  .add('default', () => (
    <ListItemChevron label="This is list item with chevron" />
  ))
  .add('with subtext', () => (
    <ListItemChevron
      label="This is list item with chevron"
      subtext="That also has subtext under it's label and it wraps up nicely"
    />
  ))
  .add('with addon', () => (
    <ListItemChevron
      label="Incoming balance"
      rightAddon={(<ValueText>$ 123.45</ValueText>)}
      bordered
    />
  ));
