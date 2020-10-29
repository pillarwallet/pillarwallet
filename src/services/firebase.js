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
import { firebase } from '@react-native-firebase/app';
import '@react-native-firebase/crashlytics';
import '@react-native-firebase/iid';
import '@react-native-firebase/analytics';
import '@react-native-firebase/messaging';

import remoteConfig from '@react-native-firebase/remote-config';
import { INITIAL_FEATURE_FLAGS } from 'constants/featureFlagsConstants';
import { log } from 'utils/logger';


export const firebaseAnalytics = firebase.analytics();
export const firebaseIid = firebase.iid();
export const firebaseCrashlytics = firebase.crashlytics();
export const firebaseMessaging = firebase.messaging();
export const firebaseRemoteConfig = firebase.remoteConfig();


export const initFirebase = async () => {
  /**
   * First, we need to set the defaults for Remote Config.
   * This makes the default values immediately available
   * on app load and can be used.
   *
   * @url https://rnfirebase.io/reference/remote-config#setDefaults
   */

  try {
    remoteConfig().setDefaults(INITIAL_FEATURE_FLAGS);
    log.info('Firebase Config: Defaults loaded and available.');
  } catch (e) {
    log.error('Firebase Config: An error occurred loading defaults:', e);
  }

  /**
   * Secondly, we need to activate any remotely fetched values
   * if they exist at all. The values that have been fetched
   * and activated override the default values above (see @url
   * above).
   *
   * @url https://rnfirebase.io/reference/remote-config#activate
   */

  try {
    const r = remoteConfig().activate();
    log.info('Firebase Config: Activation result was:', r);
  } catch (e) {
    log.error('Firebase Config: An error occurred while activating:', e);
  }
};
