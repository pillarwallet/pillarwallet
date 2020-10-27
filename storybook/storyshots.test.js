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
import initStoryshots from '@storybook/addon-storyshots';

const MockComponent = (props) => {
  const { children, ...rest } = props;
  return (<View {...rest}>{children}</View>);
};

jest.mock('global', () => global);
jest.mock('react-navigation', () => {
  return {
    withOrientation: jest.fn().mockImplementation(component => component),
    withNavigation: Component => props => (
      <Component navigation={{ navigate: jest.fn(), addListener: jest.fn() }} {...props} />
    ),
    createAppContainer: Component => props => (
      <Component navigation={{ navigate: jest.fn(), addListener: jest.fn() }} {...props} />
    ),
    createSwitchNavigator: props => jest.fn().mockImplementation(() => {
      const { TestScreen } = props;
      const { screen, params } = TestScreen;
      return <MockComponent {...params}>{ screen()}</MockComponent>;
    }),
    ThemeColors: {
      light: {
        bodyContent: '',
      },
      dark: {
        bodyContent: '',
      },
    },
    SafeAreaView: ({ children }) => <>{children}</>,
  };
});

jest.mock('react-navigation-redux-helpers', () => ({
  createReactNavigationReduxMiddleware: () => () => () => () => {},
}));

jest.useFakeTimers();

initStoryshots({ /* configuration options */ });
