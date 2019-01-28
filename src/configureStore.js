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
/**
 * Create the Redux store
 */
import { createStore, applyMiddleware } from 'redux';
import thunk from 'redux-thunk';
import { composeWithDevTools } from 'redux-devtools-extension';
import { createReactNavigationReduxMiddleware } from 'react-navigation-redux-helpers';
import ReduxAsyncQueue from 'redux-async-queue';
import PillarSdk from 'services/api';
import rootReducer from './reducers/rootReducer';

const pillarSdk = new PillarSdk();
const navigationMiddleware = createReactNavigationReduxMiddleware(
  'root',
  state => state.navigation,
);

const middlewares = [thunk.withExtraArgument(pillarSdk), navigationMiddleware, ReduxAsyncQueue];
const enhancer = composeWithDevTools({
  // Options: https://github.com/jhen0409/react-native-debugger#options
})(applyMiddleware(...middlewares));

export default function configureStore(initialState: ?Object): Object {
  const store = createStore(
    rootReducer,
    initialState,
    enhancer,
  );

  return store;
}
