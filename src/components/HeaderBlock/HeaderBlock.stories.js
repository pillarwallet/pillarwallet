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
import { storiesOf } from '@storybook/react-native';
import { getColorByTheme } from 'utils/themes';

import type { NavigationScreenProp } from 'react-navigation';

import WithThemeDecorator from '../../../storybook/WithThemeDecorator';
import HeaderBlock from './HeaderBlock';

// @FlowFixMe: mock
const navigationMock: NavigationScreenProp<void> = ({ goBack: () => {} }: any);

const Background = styled.View`
  background-color: ${getColorByTheme({ lightCustom: '#3DDDE5', darkCustom: '#18777C' })};
  flex: 1;
`;

// so floating transparent header would be more visible
const BackgroundDecorator = (story) => {
  return (
    <Background>
      {story()}
    </Background>
  );
};

storiesOf('HeaderBlock', module)
  .addDecorator(BackgroundDecorator)
  .addDecorator(WithThemeDecorator)
  .add('with items on all sides', () => (
    <HeaderBlock
      navigation={navigationMock}
      centerItems={[{ title: 'Longer screen title to check layout' }]}
      rightItems={[{ icon: 'info-circle-inverse' }]}
    />
  ))
  .add('with hamburger', () => (
    <HeaderBlock
      navigation={navigationMock}
      centerItems={[{ title: 'Title' }]}
      leftItems={[{
        icon: 'hamburger',
        onPress: () => {},
        iconProps: { secondary: true, style: { marginLeft: -4 } },
      }]}
    />
  ))
  .add('with close icon on the left', () => (
    <HeaderBlock
      navigation={navigationMock}
      centerItems={[{ title: 'Title' }]}
      leftItems={[{
        close: true,
        onPress: () => {},
      }]}
    />
  ))
  .add('with close icon on the right', () => (
    <HeaderBlock
      navigation={navigationMock}
      noBack
      centerItems={[{ title: 'Title' }]}
      rightItems={[{
        close: true,
        onPress: () => {},
      }]}
    />
  ))
  .add('edge cases', () => (
    <HeaderBlock
      navigation={navigationMock}
      centerItems={[{ title: 'Longer screen title to check layout' }]}
      rightItems={[{ icon: 'info-circle-inverse' }, { link: 'Support' }]}
      sideFlex={5}
    />
  ))
  .add('floating transparent', () => (
    <HeaderBlock
      navigation={navigationMock}
      floating
      transparent
      centerItems={[{ title: 'Floating title' }]}
      rightItems={[{ icon: 'info-circle-inverse' }]}
    />
  ));
