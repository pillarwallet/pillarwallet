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

import Button from 'components/legacy/Button';
import Tooltip from 'components/Tooltip';
import WithThemeDecorator from '../../../storybook/WithThemeDecorator';
import CenterViewDecorator from '../../../storybook/CenterViewDecorator';

const longText = 'Magna culpa aliquip nisi in eu Lorem reprehenderit laborum ' +
  'duis. In exercitation exercitation ex irure. Lorem non nostrud laboris ' +
  'consectetur culpa aliquip sunt pariatur velit cillum magna dolor.';

const TooltipTester = ({ tooltipProps }) => {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <Tooltip
      {...tooltipProps}
      isVisible={isVisible}
    >
      <Button title="Press me!" onPress={() => setIsVisible(!isVisible)} block={false} />
    </Tooltip>
  );
};

storiesOf('Tooltip', module)
  .addDecorator(CenterViewDecorator)
  .addDecorator(WithThemeDecorator)
  .add('short', () => (
    <TooltipTester tooltipProps={{
          body: "I'm a tooltip",
        }}
    />
  ))
  .add('big', () => (
    <TooltipTester tooltipProps={{
      body: longText,
    }}
    />
  ))
  .add('top', () => (
    <TooltipTester tooltipProps={{
      body: longText,
      positionOnBottom: false,
    }}
    />
  ));
