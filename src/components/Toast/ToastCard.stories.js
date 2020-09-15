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
import { storiesOf } from '@storybook/react-native';
import styled from 'styled-components/native';

import CenterView from '../../../storybook/CenterView';

import ToastCard from './ToastCard';

const Wrapper = styled(CenterView)`
  align-items: stretch;
`;

const normalText = 'Magna culpa aliquip nisi in eu';

const longText = 'Magna culpa aliquip nisi in eu Lorem reprehenderit laborum ' +
  'duis. In exercitation exercitation ex irure. Lorem non nostrud laboris ' +
  'consectetur culpa aliquip sunt pariatur velit cillum magna dolor.';

const toastStories = storiesOf('ToastCard', module);

toastStories.add('default', () => (
  <Wrapper>
    <ToastCard
      message={normalText}
      emoji="hash"
    />
  </Wrapper>
));

toastStories.add('long text', () => (
  <Wrapper>
    <ToastCard
      message={longText}
      emoji="hash"
    />
  </Wrapper>
));

toastStories.add('link', () => (
  <Wrapper>
    <ToastCard
      message={normalText}
      emoji="hash"
      link="toast link"
    />
  </Wrapper>
));
