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
import { getStorybookUI, configure, addDecorator } from '@storybook/react-native';
// eslint-disable-next-line import/no-extraneous-dependencies
import AsyncStorage from '@react-native-async-storage/async-storage';
import { withI18next } from 'storybook-addon-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { createAppContainer, createSwitchNavigator } from 'react-navigation';

import { loadStories } from './storyLoader';
import './rn-addons';

i18n.use(initReactI18next).init();

configure(loadStories, module);
addDecorator(
  withI18next({
    i18n,
  }),
);

const StorybookUIRoot = () => {
  const StorybookComponent = getStorybookUI({
    asyncStorage: AsyncStorage,
  });
  return <StorybookComponent />;
};

// $FlowFixMe: react-navigation types
const StorybookWithNav = createAppContainer(createSwitchNavigator({ Screen: StorybookUIRoot }));

export default StorybookWithNav;
