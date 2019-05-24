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
import { isTest } from 'utils/environment';
import { INITIAL_FEATURE_FLAGS } from 'constants/featureFlagsConstants';

export async function getRemoteFeatureFlags() {
  const isDev = isTest || __DEV__;
  if (isDev) firebase.config().enableDeveloperMode();
  const cacheFor = isDev ? 0 : 3600; // 1 hour cache, 0 for non-cached results
  const firebaseConfig = firebase.config();
  await firebaseConfig.fetch(cacheFor).catch(() => null); // retrieve cached or fetch new if cache expired
  await firebaseConfig.activateFetched();
  const featureFlagKeys = Object.keys(INITIAL_FEATURE_FLAGS || {});
  const fetchedFlags = await firebaseConfig.getValues(featureFlagKeys).catch(() => {});
  return Object.keys(fetchedFlags).reduce((flags, flagKey) => {
    flags[flagKey] = !!fetchedFlags[flagKey].val();
    return flags;
  }, {});
}
