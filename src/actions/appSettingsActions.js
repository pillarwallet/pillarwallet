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
import { DARK_THEME, LIGHT_THEME, UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

import set from 'lodash.set';
import firebase from 'react-native-firebase';

import Toast from 'components/Toast';
import { logUserPropertyAction, logEventAction } from 'actions/analyticsActions';
import { fetchFeatureFlagsAction } from 'actions/featureFlagsActions';
import {
  setKeychainDataObject,
  resetKeychainDataObject,
} from 'utils/keychain';

import SDKWrapper from 'services/api';

import type { Dispatch, GetState } from 'reducers/rootReducer';

import { saveDbAction } from './dbActions';
import { setActiveBlockchainNetworkAction } from './blockchainNetworkActions';
import { switchAccountAction } from './accountsActions';

export const saveOptOutTrackingAction = (status: boolean) => {
  return async (dispatch: Dispatch) => {
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
  return (dispatch: Dispatch) => {
    const settings = { baseFiatCurrency: currency };

    dispatch(saveDbAction('app_settings', { appSettings: settings }));
    dispatch(logUserPropertyAction('currency', currency));
    dispatch({ type: UPDATE_APP_SETTINGS, payload: settings });
  };
};

export const updateAppSettingsAction = (path: string, fieldValue: any) => {
  return (dispatch: Dispatch) => {
    const settings: Object = set({}, path, fieldValue);

    dispatch(saveDbAction('app_settings', { appSettings: settings }));
    dispatch({ type: UPDATE_APP_SETTINGS, payload: settings });
  };
};

export const updateAssetsLayoutAction = (layoutId: string) => {
  return (dispatch: Dispatch) => {
    const settings = { appearanceSettings: { assetsLayout: layoutId } };

    dispatch(saveDbAction('app_settings', { appSettings: settings }));
    dispatch(logEventAction('assets_layout_changed'));
    dispatch(logUserPropertyAction('assets_layout', layoutId));
    dispatch({ type: UPDATE_APP_SETTINGS, payload: settings });
  };
};

export const handleImagePickAction = (isPickingImage: boolean) => {
  return (dispatch: Dispatch) => {
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

export const changeUseBiometricsAction = (value: boolean, privateKey?: string) => {
  return async (dispatch: Dispatch) => {
    let message;
    if (value) {
      await setKeychainDataObject({ privateKey });
      message = 'Biometric login enabled';
    } else {
      await resetKeychainDataObject();
      message = 'Biometric login disabled';
    }
    dispatch(saveDbAction('app_settings', { appSettings: { useBiometrics: value } }));
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: {
        useBiometrics: value,
      },
    });
    Toast.show({
      message,
      type: 'success',
      title: 'Success',
    });
  };
};

export const setFirebaseAnalyticsCollectionEnabled = (enabled: boolean) => {
  return (dispatch: Dispatch) => {
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

export const setUserJoinedBetaAction = (userJoinedBeta: boolean, ignoreSuccessToast: boolean = false) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: { username, walletId } },
      accounts: { data: accounts },
    } = getState();
    let message;
    if (userJoinedBeta) {
      dispatch(setFirebaseAnalyticsCollectionEnabled(true));
      firebase.analytics().setUserProperty('username', username);
      message = 'You have successfully been added to the early access queue for the new Pillar Smart Wallet.';
    } else {
      firebase.analytics().setUserProperty('username', null);
      dispatch(setFirebaseAnalyticsCollectionEnabled(false));
      // in case user opts out when PPN is set as active
      dispatch(setActiveBlockchainNetworkAction(BLOCKCHAIN_NETWORK_TYPES.ETHEREUM));
      // in case user opts out when Smart wallet account is active
      const keyBasedAccount = accounts.find(acc => acc.type === ACCOUNT_TYPES.SMART_WALLET) || {};
      dispatch(switchAccountAction(keyBasedAccount.id));
      message = 'You have successfully left Smart Wallet Early Access program.';
    }
    await api.updateUser({ walletId, betaProgramParticipant: userJoinedBeta });
    dispatch(saveDbAction('app_settings', { appSettings: { userJoinedBeta } }));
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: {
        userJoinedBeta,
      },
    });
    await dispatch(fetchFeatureFlagsAction());
    if (ignoreSuccessToast) return;
    Toast.show({
      message,
      type: 'success',
      title: 'Success',
      autoClose: false,
    });
  };
};


export const changeAppThemeAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      appSettings: { data: { themeType: previousTheme } },
    } = getState();

    const themeType = previousTheme === LIGHT_THEME ? DARK_THEME : LIGHT_THEME;

    dispatch(saveDbAction('app_settings', { appSettings: { themeType } }));
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: { themeType },
    });
  };
};

export const setAppThemeAction = () => {
  return (dispatch: Dispatch) => {
    const themeType = LIGHT_THEME; // TODO: get theme based on user preferences;

    dispatch(saveDbAction('app_settings', { appSettings: { themeType } }));
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: { themeType },
    });
  };
};
