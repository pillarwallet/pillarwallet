// @flow
import { NavigationActions } from 'react-navigation';
import { AUTH_FLOW, ONBOARDING_FLOW } from 'constants/navigationConstants';
import Storage from 'services/storage';
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';

const storage = Storage.getInstance('db');

export const fetchAppSettingsAndRedirectAction = () => {
  return async (dispatch: Function) => {
    try {
      const appSettings = await storage.get('app_settings');
      dispatch({ type: UPDATE_APP_SETTINGS, payload: appSettings });
      if (appSettings.wallet && appSettings.OTP) {
        dispatch(NavigationActions.navigate({ routeName: AUTH_FLOW }));
      }

      if (!appSettings.wallet && appSettings.OTP) {
        dispatch(NavigationActions.navigate({ routeName: ONBOARDING_FLOW }));
      }

    } catch (e) {
      dispatch({ type: UPDATE_APP_SETTINGS, payload: {} });
     }
  };
};