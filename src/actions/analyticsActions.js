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
import appsFlyer from 'react-native-appsflyer';
import get from 'lodash.get';

// Services
import { firebaseAnalytics } from 'services/firebase';

// Reducers
import type { Dispatch, GetState } from 'reducers/rootReducer';

// Utils
import { printLog, errorLog } from 'utils/common';

const isTrackingEnabled = (getState: GetState): boolean => !get(getState(), 'appSettings.data.optOutTracking', false);

export const logScreenViewAction = (screenName: string) => {
  return (dispatch: Dispatch, getState: GetState) => {
    if (!isTrackingEnabled(getState)) return;
    firebaseAnalytics.logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
  };
};

export const logEventAction = (name: string, properties?: Object) => {
  return (dispatch: Dispatch, getState: GetState) => {
    if (!isTrackingEnabled(getState)) return;
    firebaseAnalytics.logEvent(name, properties);
  };
};

export const logUserPropertyAction = (name: string, value?: string) => {
  return (dispatch: Dispatch, getState: GetState) => {
    if (!isTrackingEnabled(getState) || !value) return;
    firebaseAnalytics.logEvent('property_changed', { [name]: value });
  };
};

export const appsFlyerlogEventAction = (eventName: string, eventValues?: Object) => {
  return (dispatch: Dispatch, getState: GetState) => {
    if (!isTrackingEnabled(getState)) return;
    appsFlyer.logEvent(
      eventName,
      eventValues,
      (res) => {
        printLog(res);
      },
      (err) => {
        errorLog(err);
      },
    );
    dispatch(logEventAction(eventName, eventValues));
  };
};
