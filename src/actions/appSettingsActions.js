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
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import set from 'lodash.set';
import firebase from 'react-native-firebase';

import Toast from 'components/Toast';
import { logUserPropertyAction, logEventAction } from 'actions/analyticsActions';
import { saveDbAction } from './dbActions';

export const saveOptOutTrackingAction = (status: boolean) => {
  return async (dispatch: Function) => {
    const settings = { optOutTracking: status };

    if (status) {
      dispatch(logEventAction('tracking_opted_out'));
    } else {
      dispatch(logEventAction('tracking_opted_in'));
    }
    dispatch(saveDbAction('app_settings', { appSettings: settings }));
    dispatch({ type: UPDATE_APP_SETTINGS, payload: settings });
  };
};

export const saveBaseFiatCurrencyAction = (currency: string) => {
  return (dispatch: Function) => {
    const settings = { baseFiatCurrency: currency };

    dispatch(saveDbAction('app_settings', { appSettings: settings }));
    dispatch(logUserPropertyAction('currency', currency));
    dispatch({ type: UPDATE_APP_SETTINGS, payload: settings });
  };
};

export const updateAppSettingsAction = (path: string, fieldValue: any) => {
  return (dispatch: Function) => {
    const settings = set({}, path, fieldValue);

    dispatch(saveDbAction('app_settings', { appSettings: settings }));
    dispatch({ type: UPDATE_APP_SETTINGS, payload: settings });
  };
};

export const updateAssetsLayoutAction = (layoutId: string) => {
  return (dispatch: Function) => {
    const settings = { appearanceSettings: { assetsLayout: layoutId } };

    dispatch(saveDbAction('app_settings', { appSettings: settings }));
    dispatch(logEventAction('assets_layout_changed'));
    dispatch(logUserPropertyAction('assets_layout', layoutId));
    dispatch({ type: UPDATE_APP_SETTINGS, payload: settings });
  };
};

export const handleImagePickAction = (isPickingImage: boolean) => {
  return (dispatch: Function) => {
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: {
        isPickingImage,
      },
    });
  };
};

export const setBrowsingWebViewAction = (isBrowsingWebView: boolean) => ({
  type: UPDATE_APP_SETTINGS,
  payload: {
    isBrowsingWebView,
  },
});

export const changeUseBiometricsAction = (value: boolean) => {
  return async (dispatch: Function) => {
    dispatch(saveDbAction('app_settings', { appSettings: { useBiometrics: value } }));
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: {
        useBiometrics: value,
      },
    });
  };
};

export const setFirebaseAnalyticsCollectionEnabled = (enabled: boolean) => {
  return (dispatch: Function) => {
    firebase.analytics().setAnalyticsCollectionEnabled(enabled);
    dispatch(saveDbAction('app_settings', { appSettings: { firebaseAnalyticsConnectionEnabled: enabled } }));
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: {
        firebaseAnalyticsConnectionEnabled: enabled,
      },
    });
  };
};

export const setUserJoinedBetaAction = (userJoinedBeta: boolean) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { user: { data: { username, walletId } } } = getState();
    let message;
    if (userJoinedBeta) {
      dispatch(setFirebaseAnalyticsCollectionEnabled(true));
      firebase.analytics().setUserProperty('username', username);
      message = 'You have successfully applied for Beta Testing.' +
        'We will let you know once your application is approved.';
    } else {
      firebase.analytics().setUserProperty('username', null);
      dispatch(setFirebaseAnalyticsCollectionEnabled(false));
      message = 'You have successfully left Beta Testing.';
    }
    await api.updateUser({ walletId, betaProgramParticipant: userJoinedBeta });
    dispatch(saveDbAction('app_settings', { appSettings: { userJoinedBeta } }));
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: {
        userJoinedBeta,
      },
    });
    Toast.show({ message, type: 'success', title: 'Success' });
  };
};
