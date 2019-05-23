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
  if (isTest) firebase.config().enableDeveloperMode();
  // 0 for non-cached results
  await firebase.config().fetch(0);
  await firebase.config().activateFetched();
  const featureFlagKeys = Object.keys(INITIAL_FEATURE_FLAGS || {});
  const fetchedFlags = await firebase.config().getValues(featureFlagKeys);
  return Object.keys(fetchedFlags).reduce((flags, flagKey) => {
    flags[flagKey] = !!fetchedFlags[flagKey].val();
    return flags;
  }, {});
}
