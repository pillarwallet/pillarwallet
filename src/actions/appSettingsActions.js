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
import branchIo from 'react-native-branch';
import set from 'lodash.set';
import { Appearance } from 'react-native-appearance';
import t from 'translations/translate';

// constants
import {
  DARK_PREFERENCE,
  DARK_THEME,
  LIGHT_THEME,
  UPDATE_APP_SETTINGS,
} from 'constants/appSettingsConstants';

// components
import Toast from 'components/Toast';

// services
import { firebaseAnalytics } from 'services/firebase';

// utils
import { setKeychainDataObject } from 'utils/keychain';
import { delay } from 'utils/common';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { KeyChainData } from 'utils/keychain';

// actions
import { saveDbAction } from './dbActions';
import { logUserPropertyAction, logEventAction } from './analyticsActions';


export const saveOptOutTrackingAction = (status: boolean) => {
  return async (dispatch: Dispatch) => {
    const settings = { optOutTracking: status };
    if (status) {
      dispatch(logEventAction('tracking_opted_out'));
    } else {
      dispatch(logEventAction('tracking_opted_in'));
    }
    await firebaseAnalytics.setAnalyticsCollectionEnabled(status);
    try {
      await branchIo.disableTracking(status);
    } catch (e) {
      // catch exception if native module failed by any reason
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

export const changeUseBiometricsAction = (value: boolean, data: KeyChainData, noToast?: boolean) => {
  return async (dispatch: Dispatch) => {
    await setKeychainDataObject(data, value);
    const message = value ? t('toast.biometricLoginEnabled') : t('toast.biometricLoginDisabled');
    dispatch(saveDbAction('app_settings', { appSettings: { useBiometrics: value } }));
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: {
        useBiometrics: value,
      },
    });
    if (!noToast) {
      delay(200)
        .then(() => Toast.show({
          message,
          emoji: 'ok_hand',
        }))
        .catch(() => null);
    }
  };
};

export const setAppThemeAction = (themeType: string, isManualThemeSelection?: boolean) => {
  return (dispatch: Dispatch) => {
    dispatch(saveDbAction('app_settings', { appSettings: { themeType, isManualThemeSelection } }));
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: { themeType, isManualThemeSelection },
    });
  };
};

// set theme based on selected mode on users devices
// (unless they have other theme option selected manually)
export const handleSystemDefaultThemeChangeAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      appSettings: { data: { themeType, isManualThemeSelection } },
    } = getState();

    if (isManualThemeSelection) return;
    const themeToSet = Appearance.getColorScheme() === DARK_PREFERENCE ? DARK_THEME : LIGHT_THEME;
    if (themeToSet === themeType) return;

    dispatch(setAppThemeAction(themeToSet));
  };
};

export const hasSeenExchangeIntroAction = () => {
  return (dispatch: Dispatch) => {
    dispatch(saveDbAction('app_settings', { appSettings: { hasSeenExchangeIntro: true } }));
    dispatch({ type: UPDATE_APP_SETTINGS, payload: { hasSeenExchangeIntro: true } });
  };
};

export const toggleBalanceAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      appSettings: { data: { hideBalance } },
    } = getState();

    const newBalanceVisibilityState = !hideBalance;

    dispatch(saveDbAction('app_settings', { appSettings: { hideBalance: newBalanceVisibilityState } }));
    dispatch({ type: UPDATE_APP_SETTINGS, payload: { hideBalance: newBalanceVisibilityState } });
  };
};

export const toggleBadgesAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      appSettings: { data: { hideBadges } },
    } = getState();
    const newBadgesState = !hideBadges;

    dispatch(saveDbAction('app_settings', { appSettings: { hideBadges: newBadgesState } }));
    dispatch({ type: UPDATE_APP_SETTINGS, payload: { hideBadges: newBadgesState } });
  };
};

export const togglePoolTogetherAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      appSettings: { data: { hidePoolTogether } },
    } = getState();
    const newPoolTogetherState = !hidePoolTogether;

    dispatch(saveDbAction('app_settings', { appSettings: { hidePoolTogether: newPoolTogetherState } }));
    dispatch({ type: UPDATE_APP_SETTINGS, payload: { hidePoolTogether: newPoolTogetherState } });
  };
};

export const dismissConnectAppsIntroAction = () => {
  return (dispatch: Dispatch) => {
    dispatch(saveDbAction('app_settings', { appSettings: { hasDismissedConnectAppsIntro: true } }));
    dispatch({ type: UPDATE_APP_SETTINGS, payload: { hasDismissedConnectAppsIntro: true } });
  };
};

export const setPreferredGasTokenAction = (preferredGasToken: string) => {
  return (dispatch: Dispatch) => {
    dispatch(saveDbAction('app_settings', { appSettings: { preferredGasToken } }));
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: { preferredGasToken },
    });
  };
};

export const initialDeeplinkExecuted = () => {
  return (dispatch: Dispatch) => {
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: { initialDeeplinkExecuted: true },
    });
  };
};

export const hasSeenRecoveryPortalIntroAction = () => {
  return (dispatch: Dispatch) => {
    dispatch(updateAppSettingsAction('hasSeenRecoveryPortalIntro', true));
  };
};

export const toggleLendingDepositsAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { appSettings: { data: { hideLendingDeposits } } } = getState();
    dispatch(updateAppSettingsAction('hideLendingDeposits', !hideLendingDeposits));
  };
};

export const toggleOmitPinOnLoginAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { appSettings: { data: { omitPinOnLogin } } } = getState();
    dispatch(saveDbAction('app_settings', { appSettings: { omitPinOnLogin: !omitPinOnLogin } }));
    dispatch({ type: UPDATE_APP_SETTINGS, payload: { omitPinOnLogin: !omitPinOnLogin } });
  };
};

export const toggleSablierAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      appSettings: { data: { hideSablier } },
    } = getState();
    const newSablierState = !hideSablier;

    dispatch(saveDbAction('app_settings', { appSettings: { hideSablier: newSablierState } }));
    dispatch({ type: UPDATE_APP_SETTINGS, payload: { hideSablier: newSablierState } });
  };
};
