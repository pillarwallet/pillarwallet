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
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import configureStore from './src/configureStore';

/**
 * create store at top level allows React Native fast refresh https://reactnative.dev/docs/fast-refresh
 * otherwise redux store replacement error is thrown
 * additional note: other Hot Reload "workarounds" doesn't work with Fast Refresh
 */
const { store, persistor } = configureStore();

// required return: registerReturnFn() => componentReturnFn() => component
AppRegistry.registerComponent(appName, () => () => <App store={store} persistor={persistor} />);
