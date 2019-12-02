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
import firebase from 'react-native-firebase';
import { isProdEnv, isTest } from 'utils/environment';
import { INITIAL_FEATURE_FLAGS, DEVELOPMENT_FEATURE_FLAGS } from 'constants/featureFlagsConstants';

const isDev = __DEV__ || !isProdEnv;

export async function getRemoteFeatureFlags() {
  if (isTest) return INITIAL_FEATURE_FLAGS;
  if (isDev) firebase.config().enableDeveloperMode();
  const firebaseConfig = firebase.config();
  firebaseConfig.setDefaults(INITIAL_FEATURE_FLAGS);
  await firebaseConfig.fetch(0).catch(() => null); // 0 – try no caching, though Firebase can still throttle requests
  await firebaseConfig.activateFetched().catch(() => null);
  const featureFlagKeys = Object.keys(INITIAL_FEATURE_FLAGS || {});
  const fetchedFlags = await firebaseConfig.getValues(featureFlagKeys).catch(() => ({}));
  const mappedFeatureFlags = Object.keys(fetchedFlags).reduce((flags, flagKey) => ({
    ...flags,
    [flagKey]: !!fetchedFlags[flagKey].val(),
  }), {});
  return isDev
    ? { ...mappedFeatureFlags, ...DEVELOPMENT_FEATURE_FLAGS }
    : mappedFeatureFlags;
}
