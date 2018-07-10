// @flow
import { NavigationActions } from 'react-navigation';
import Storage from 'services/storage';
import { AUTH_FLOW, ONBOARDING_FLOW } from 'constants/navigationConstants';
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { UPDATE_ASSETS } from 'constants/assetsConstants';
import { UPDATE_USER, REGISTERED, PENDING } from 'constants/userConstants';
import { UPDATE_CONTACTS } from 'constants/contactsConstants';
import { UPDATE_INVITATIONS } from 'constants/invitationsConstants';

const storage = Storage.getInstance('db');

export const initAppAndRedirectAction = () => {
  return async (dispatch: Function) => {
    const { appSettings = {} } = await storage.get('app_settings');
    if (appSettings.wallet) {
      const { assets = {} } = await storage.get('assets');
      dispatch({ type: UPDATE_APP_SETTINGS, payload: appSettings });
      dispatch({ type: UPDATE_ASSETS, payload: assets });
      const { contacts = [] } = await storage.get('contacts');
      dispatch({ type: UPDATE_CONTACTS, payload: contacts });

      const { invitations = [] } = await storage.get('invitations');
      dispatch({ type: UPDATE_INVITATIONS, payload: invitations });

      dispatch(NavigationActions.navigate({ routeName: AUTH_FLOW }));
      return;
    }
    dispatch({ type: UPDATE_APP_SETTINGS, payload: appSettings });
    dispatch(NavigationActions.navigate({ routeName: ONBOARDING_FLOW }));
  };
};

export const fetchUserAction = () => {
  return async (dispatch: Function) => {
    let { user } = await storage.get('user');
    user = user || {};
    const userState = user.walletId ? REGISTERED : PENDING;
    dispatch({
      type: UPDATE_USER,
      payload: {
        user,
        state: userState,
      },
    });
  };
};
