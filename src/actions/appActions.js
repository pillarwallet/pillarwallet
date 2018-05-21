// @flow
import { NavigationActions } from 'react-navigation';
import { AUTH_FLOW, ONBOARDING_FLOW } from 'constants/navigationConstants';
import Storage from 'services/storage';
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { UPDATE_ASSETS } from 'constants/assetsConstants';
import { SET_USER, REGISTERED, PENDING } from 'constants/userConstants';

const storage = Storage.getInstance('db');

export const initAppAndRedirectAction = () => {
  return async (dispatch: Function) => {
    const appSettings = await storage.get('app_settings');
    dispatch({ type: UPDATE_APP_SETTINGS, payload: appSettings });

    if (appSettings.wallet && appSettings.OTP) {
      const { assets } = await storage.get('assets');
      dispatch({ type: UPDATE_ASSETS, payload: assets });

      dispatch(NavigationActions.navigate({ routeName: AUTH_FLOW }));
    }

    if (!appSettings.wallet && appSettings.OTP) {
      dispatch(NavigationActions.navigate({ routeName: ONBOARDING_FLOW }));
    }
  };
};

export const fetchUserAction = () => {
  return async (dispatch: Function) => {
    const { user } = await storage.get('user');
    const userState = Object.keys(user || {}).length ? REGISTERED : PENDING;
    dispatch({
      type: SET_USER,
      payload: {
        user,
        state: userState,
      },
    });
  };
};
