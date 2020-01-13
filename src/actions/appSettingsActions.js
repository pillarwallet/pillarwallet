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
import { Appearance } from 'react-native-appearance';

import {
  DARK_PREFERENCE, DARK_THEME,
  LIGHT_THEME,
  UPDATE_APP_SETTINGS,
  USER_JOINED_BETA_SETTING,
} from 'constants/appSettingsConstants';
import { BLOCKCHAIN_NETWORK_TYPES } from 'constants/blockchainNetworkConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

import set from 'lodash.set';

import Toast from 'components/Toast';
import { logUserPropertyAction, logEventAction } from 'actions/analyticsActions';
import {
  setKeychainDataObject,
  resetKeychainDataObject,
} from 'utils/keychain';

import SDKWrapper from 'services/api';

import type { Dispatch, GetState } from 'reducers/rootReducer';

import { saveDbAction } from './dbActions';
import { setActiveBlockchainNetworkAction } from './blockchainNetworkActions';
import { switchAccountAction } from './accountsActions';
import { loadFeatureFlagsAction } from './featureFlagsActions';

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

export const changeUseBiometricsAction = (value: boolean, privateKey?: string, noToast?: boolean) => {
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
    if (!noToast) {
      Toast.show({
        message,
        type: 'success',
        title: 'Success',
      });
    }
  };
};

export const setUserJoinedBetaAction = (userJoinedBeta: boolean) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: { walletId } },
      accounts: { data: accounts },
      session: { data: { isOnline } },
    } = getState();

    if (!isOnline) {
      Toast.show({
        message: `Cannot opt-${userJoinedBeta ? 'in to' : 'out from'} Early Access program while offline`,
        type: 'warning',
        autoClose: false,
      });
      return;
    }

    let message;

    if (userJoinedBeta) {
      message = 'You have successfully been added to the Early Access program queue.';
    } else {
      // in case user opts out when PPN is set as active
      dispatch(setActiveBlockchainNetworkAction(BLOCKCHAIN_NETWORK_TYPES.ETHEREUM));
      // in case user opts out when Smart wallet account is active
      const keyBasedAccount = accounts.find(({ type }) => type === ACCOUNT_TYPES.KEY_BASED);
      if (keyBasedAccount) dispatch(switchAccountAction(keyBasedAccount.id));
      message = 'You have successfully left Early Access program.';
    }

    await api.updateUser({ walletId, betaProgramParticipant: userJoinedBeta });
    dispatch(updateAppSettingsAction(USER_JOINED_BETA_SETTING, userJoinedBeta));

    await dispatch(loadFeatureFlagsAction());

    Toast.show({
      message,
      type: 'success',
      title: 'Success',
      autoClose: false,
    });
  };
};

export const handleSystemDefaultThemeChangeAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      appSettings: { data: { themeType, isSetAsSystemPrefTheme } },
    } = getState();

    if (!isSetAsSystemPrefTheme) return;
    const defaultThemePreference = Appearance.getColorScheme() === DARK_PREFERENCE ? DARK_THEME : LIGHT_THEME;
    if (defaultThemePreference === themeType) return;

    dispatch(saveDbAction('app_settings', { appSettings: { themeType: defaultThemePreference } }));
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: { themeType: defaultThemePreference },
    });
  };
};

export const changeAppThemeAction = (themeType: string, setAsPreferred?: boolean) => {
  return (dispatch: Dispatch) => {
    dispatch(saveDbAction('app_settings', { appSettings: { themeType, isSetAsSystemPrefTheme: !!setAsPreferred } }));
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: { themeType, isSetAsSystemPrefTheme: !!setAsPreferred },
    });
  };
};

export const setAppThemeAction = () => {
  return (dispatch: Dispatch) => {
    const themeType = LIGHT_THEME;

    dispatch(saveDbAction('app_settings', { appSettings: { themeType } }));
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: { themeType },
    });
  };
};
