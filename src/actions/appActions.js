// @flow
import { NavigationActions } from 'react-navigation';
import { Sentry } from 'react-native-sentry';
import Storage from 'services/storage';
import { AUTH_FLOW, ONBOARDING_FLOW } from 'constants/navigationConstants';
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { UPDATE_ASSETS, UPDATE_BALANCES } from 'constants/assetsConstants';
import { UPDATE_CONTACTS } from 'constants/contactsConstants';
import { UPDATE_INVITATIONS } from 'constants/invitationsConstants';
import { UPDATE_ACCESS_TOKENS } from 'constants/accessTokensConstants';
import { SET_HISTORY } from 'constants/historyConstants';

const storage = Storage.getInstance('db');

const BACKGROUND = 'background';
const ANDROID = 'android';

export const initAppAndRedirectAction = (appState: string, platform: string) => {
  return async (dispatch: Function) => {
    // Appears that android back-handler on exit causes the app to mount once again.
    if (appState === BACKGROUND && platform === ANDROID) return;
    const { appSettings = {} } = await storage.get('app_settings');
    if (appSettings.wallet) {
      const { assets = {} } = await storage.get('assets');
      dispatch({ type: UPDATE_ASSETS, payload: assets });

      const { balances = {} } = await storage.get('balances');
      dispatch({ type: UPDATE_BALANCES, payload: balances });

      const { contacts = [] } = await storage.get('contacts');
      dispatch({ type: UPDATE_CONTACTS, payload: contacts });

      const { invitations = [] } = await storage.get('invitations');
      dispatch({ type: UPDATE_INVITATIONS, payload: invitations });

      const { accessTokens = [] } = await storage.get('accessTokens');
      dispatch({ type: UPDATE_ACCESS_TOKENS, payload: accessTokens });

      const { history = [] } = await storage.get('history');
      // TEMP FIX, REMOVE LATER
      const filteredHistory = history
        .filter(({ hash }) => !!hash)
        .filter(({ value }) => typeof value !== 'object');
      if (filteredHistory.length !== history.length) {
        storage.save('history', { history: filteredHistory }, true);
      }
      dispatch({ type: SET_HISTORY, payload: filteredHistory });

      dispatch({ type: UPDATE_APP_SETTINGS, payload: appSettings });
      dispatch(NavigationActions.navigate({ routeName: AUTH_FLOW }));
      return;
    }
    dispatch({ type: UPDATE_APP_SETTINGS, payload: appSettings });
    dispatch(NavigationActions.navigate({ routeName: ONBOARDING_FLOW }));
  };
};

export const setupSentryAction = (user: Object, wallet: Object) => {
  return async () => {
    const { id, username, walletId = '' } = user;
    const { address } = wallet;
    Sentry.setUserContext({
      userID: id,
      username,
      extra: {
        walletId,
        ethAddress: address,
      },
    });
  };
};
