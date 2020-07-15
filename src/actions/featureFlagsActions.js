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

import remoteConfig from '@react-native-firebase/remote-config';
import {
  INITIAL_FEATURE_FLAGS,
  SET_FEATURE_FLAGS,
} from 'constants/featureFlagsConstants';
import type { Dispatch } from 'reducers/rootReducer';
import { reportOrWarn } from 'utils/common';

type FeatureFlags = {[key: string]: { value: string, source: string }}

export const loadFeatureFlagsAction = () => {
  return async (dispatch: Dispatch) => {
    remoteConfig()
      .setDefaults(INITIAL_FEATURE_FLAGS)
      .then(() => remoteConfig().fetchAndActivate())
      .then(activated => {
        if (!activated) {
          reportOrWarn('Failed to fetch feature flags, using defaults', null, 'warning');
        }
        const featureFlags: FeatureFlags = remoteConfig().getAll();
        const parsedFeatureFlags = Object.keys(featureFlags).map((key: string) => {
          return { [key]: !!featureFlags[key].value };
        });

        dispatch({ type: SET_FEATURE_FLAGS, payload: parsedFeatureFlags });
      })
      .catch(e => { reportOrWarn('Failed to fetch feature flags or initialize with defaults', e, 'warning'); });
  };
};
