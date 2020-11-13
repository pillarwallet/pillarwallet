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

import { firebaseRemoteConfig } from 'services/firebase';
import { reportOrWarn } from 'utils/common';
import { log } from 'utils/logger';
import { isTest } from 'utils/environment';

export const loadRemoteConfigAction = () => {
  return () => {
    /**
     * Instruct Remote Config to fetch the latest config
     * values available online. When the app is next launched,
     * the app will activate() the latest values available.
     *
     * @url https://rnfirebase.io/reference/remote-config#fetch
     */
    firebaseRemoteConfig
      .fetch(__DEV__ ? 0 : 3600) // Are we in dev mode? Don't cache, otherwise 1 hour.
      .then(() => {
        if (isTest) return; // do not print log on test instance
        log.info('Firebase Config: Fetched the latest remote config values, if any.');
      })
      .catch(e => { reportOrWarn('Failed to fetch feature flags or initialize with defaults', e, 'warning'); });
  };
};
