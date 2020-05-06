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

import get from 'lodash.get';
import isEmpty from 'lodash.isempty';

import {
  DEVELOPMENT_FEATURE_FLAGS,
  INITIAL_FEATURE_FLAGS,
  SET_FEATURE_FLAGS,
} from 'constants/featureFlagsConstants';
import { saveDbAction } from 'actions/dbActions';
import { isProdEnv, isTest } from 'utils/environment';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type SDKWrapper from 'services/api';

export const loadFeatureFlagsAction = (userInfo?: any) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const isOnline = get(getState(), 'session.data.isOnline');

    // do not override existing feature flags if offline
    if (!isOnline) return;

    // fetch latest userInfo if it was not provided
    if (isEmpty(userInfo)) {
      const walletId = get(getState(), 'user.data.walletId');
      userInfo = await api.userInfo(walletId);
    }

    /**
     * (isProdEnv && !__DEV__) to make sure that it's really dev env and not prod env (mainnet) running in dev
     * isTest check to run test suites against prod env
     */
    const userFeatureFlags = (isProdEnv && !__DEV__) || isTest
      ? get(userInfo, 'featureFlags', {})
      : DEVELOPMENT_FEATURE_FLAGS;

    // combine initial with fetched
    const featureFlags = { ...INITIAL_FEATURE_FLAGS, ...userFeatureFlags };

    dispatch({ type: SET_FEATURE_FLAGS, payload: featureFlags });
    dispatch(saveDbAction('featureFlags', { featureFlags }, true));
  };
};
