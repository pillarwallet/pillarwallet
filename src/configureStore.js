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
/* eslint-disable i18next/no-literal-string */

/**
 * Create the Redux store
 */
import { createStore, applyMiddleware } from 'redux';
// eslint-disable-next-line import/no-extraneous-dependencies
import AsyncStorage from '@react-native-async-storage/async-storage';
import { persistStore, persistReducer, createMigrate } from 'redux-persist';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import thunk from 'redux-thunk';
import createSagaMiddleware from 'redux-saga';
import { composeWithDevTools } from '@redux-devtools/extension';
import { createReactNavigationReduxMiddleware } from 'react-navigation-redux-helpers';
import ReduxAsyncQueue from 'redux-async-queue';
import rootSaga from 'redux/sagas/root-saga';
import offlineMiddleware from 'utils/offlineMiddleware';
import rootReducer from './reducers/rootReducer';

import migrations from './redux-migrations/migrations';

// migration example
/*
 * TODO: pouchdb old migrations should be run before redux-persist
 * consider the case when user has no accounts yet and needs to
 * migrate first to the accounts model and then to redux-persist migration
 */
/*
const migrations = {
  '0': state => { // eslint-disable-line
    return {
      ...state,
    };
  },
};
*/
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  version: 1, // bump up the version when new changes are made with migrations
  stateReconciler: autoMergeLevel2,
  whitelist: ['history', 'walletConnectSessions', 'liquidityPools'],
  migrate: createMigrate(migrations, { debug: false }),
  timeout: 0, // HACK: wait until the storage responds
};
const pReducer = persistReducer(persistConfig, rootReducer);

const navigationMiddleware = createReactNavigationReduxMiddleware('root', (state) => state.navigation);

const initialiseSagaMiddleware = createSagaMiddleware();

const middlewares = [thunk, navigationMiddleware, ReduxAsyncQueue, offlineMiddleware, initialiseSagaMiddleware];
const enhancer = composeWithDevTools({
  // Options: https://github.com/jhen0409/react-native-debugger#options
})(applyMiddleware(...middlewares));

const configureStore = (): Object => {
  const store = createStore(pReducer, enhancer);

  const persistor = persistStore(store);

  initialiseSagaMiddleware.run(rootSaga);

  return { store, persistor };
};

export const { store, persistor } = configureStore();
