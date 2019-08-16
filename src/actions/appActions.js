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
import { NavigationActions } from 'react-navigation';
import { Sentry } from 'react-native-sentry';

// services
import Storage from 'services/storage';
import { navigate } from 'services/navigation';
import { loadAndMigrate } from 'services/dataMigration';

// constants
import { AUTH_FLOW, ONBOARDING_FLOW } from 'constants/navigationConstants';
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { UPDATE_ASSETS, UPDATE_BALANCES } from 'constants/assetsConstants';
import { UPDATE_CONTACTS } from 'constants/contactsConstants';
import { UPDATE_INVITATIONS } from 'constants/invitationsConstants';
import { UPDATE_ACCESS_TOKENS } from 'constants/accessTokensConstants';
import { UPDATE_SESSION } from 'constants/sessionConstants';
import { ADD_NOTIFICATION } from 'constants/notificationConstants';
import { UPDATE_WALLET_IMPORT_STATE } from 'constants/walletConstants';
import { UPDATE_OAUTH_TOKENS } from 'constants/oAuthConstants';
import { UPDATE_TX_COUNT } from 'constants/txCountConstants';
import { UPDATE_CONNECTION_KEY_PAIRS } from 'constants/connectionKeyPairsConstants';
import { UPDATE_CONNECTION_IDENTITY_KEYS } from 'constants/connectionIdentityKeysConstants';
import { UPDATE_COLLECTIBLES, SET_COLLECTIBLES_TRANSACTION_HISTORY } from 'constants/collectiblesConstants';
import { UPDATE_BADGES, SET_CONTACTS_BADGES } from 'constants/badgesConstants';
import { UPDATE_RATES } from 'constants/ratesConstants';
import { UPDATE_OFFLINE_QUEUE, START_OFFLINE_QUEUE } from 'constants/offlineQueueConstants';
import {
  SET_EXCHANGE_ALLOWANCES,
  SET_CONNECTED_EXCHANGE_PROVIDERS,
} from 'constants/exchangeConstants';
import { UPDATE_ACCOUNTS } from 'constants/accountsConstants';
import {
  DISMISS_SMART_WALLET_UPGRADE,
  SET_SMART_WALLET_ACCOUNTS,
  SET_SMART_WALLET_ASSETS_TRANSFER_TRANSACTIONS,
  SET_SMART_WALLET_DEPLOYMENT_DATA,
  SET_SMART_WALLET_UPGRADE_STATUS,
  SET_SMART_WALLET_LAST_SYNCED_HASH,
} from 'constants/smartWalletConstants';
import {
  SET_ACCOUNT_RECOVERY_AGENTS,
  SET_ACCOUNT_RECOVERY_TRANSACTIONS,
  SET_ACCOUNT_RECOVERY_ENABLED,
} from 'constants/accountRecoveryConstants';
import {
  UPDATE_PAYMENT_NETWORK_BALANCES,
  UPDATE_PAYMENT_NETWORK_STAKED,
  MARK_PLR_TANK_INITIALISED,
} from 'constants/paymentNetworkConstants';

const storage = Storage.getInstance('db');

const BACKGROUND = 'background';
const ANDROID = 'android';

export const initAppAndRedirectAction = (appState: string, platform: string) => {
  return async (dispatch: Function, getState: Function) => {
    // Appears that android back-handler on exit causes the app to mount once again.
    if (appState === BACKGROUND && platform === ANDROID) return;

    // TEMP: remove after we move to AsyncStorage
    await storage.repair();

    // $FlowFixMe
    const appSettings = await loadAndMigrate('app_settings', dispatch, getState);

    const { wallet } = await storage.get('wallet');

    if (appSettings.wallet) {
      const accounts = await loadAndMigrate('accounts', dispatch, getState);
      dispatch({ type: UPDATE_ACCOUNTS, payload: accounts });

      const { assets = {} } = await storage.get('assets');
      dispatch({ type: UPDATE_ASSETS, payload: assets });

      const balances = await loadAndMigrate('balances', dispatch, getState);
      dispatch({ type: UPDATE_BALANCES, payload: balances });

      const { rates = {} } = await storage.get('rates');
      dispatch({ type: UPDATE_RATES, payload: rates });

      const { contacts = [] } = await storage.get('contacts');
      dispatch({ type: UPDATE_CONTACTS, payload: contacts });

      const { invitations = [] } = await storage.get('invitations');
      dispatch({ type: UPDATE_INVITATIONS, payload: invitations });

      const { accessTokens = [] } = await storage.get('accessTokens');
      dispatch({ type: UPDATE_ACCESS_TOKENS, payload: accessTokens });

      const { oAuthTokens = {} } = await storage.get('oAuthTokens');
      dispatch({ type: UPDATE_OAUTH_TOKENS, payload: oAuthTokens });

      const { txCount = {} } = await storage.get('txCount');
      dispatch({ type: UPDATE_TX_COUNT, payload: txCount });

      const { connectionKeyPairs = [] } = await storage.get('connectionKeyPairs');
      dispatch({ type: UPDATE_CONNECTION_KEY_PAIRS, payload: connectionKeyPairs });

      const { connectionIdentityKeys = [] } = await storage.get('connectionIdentityKeys');
      dispatch({ type: UPDATE_CONNECTION_IDENTITY_KEYS, payload: connectionIdentityKeys });

      const collectibles = await loadAndMigrate('collectibles', dispatch, getState);
      dispatch({ type: UPDATE_COLLECTIBLES, payload: collectibles });

      const collectiblesHistory = await loadAndMigrate('collectiblesHistory', dispatch, getState);
      dispatch({ type: SET_COLLECTIBLES_TRANSACTION_HISTORY, payload: collectiblesHistory });

      const { badges = [] } = await storage.get('badges');
      dispatch({ type: UPDATE_BADGES, payload: badges });

      const { contactsBadges = {} } = await storage.get('contactsBadges');
      dispatch({ type: SET_CONTACTS_BADGES, payload: contactsBadges });

      const { paymentNetworkBalances = {} } = await storage.get('paymentNetworkBalances');
      dispatch({ type: UPDATE_PAYMENT_NETWORK_BALANCES, payload: paymentNetworkBalances });

      const { paymentNetworkStaked = '' } = await storage.get('paymentNetworkStaked');
      dispatch({ type: UPDATE_PAYMENT_NETWORK_STAKED, payload: paymentNetworkStaked });

      const { isPLRTankInitialised = false } = await storage.get('isPLRTankInitialised');
      if (isPLRTankInitialised) dispatch({ type: MARK_PLR_TANK_INITIALISED });

      const { offlineQueue = [] } = await storage.get('offlineQueue');
      dispatch({ type: UPDATE_OFFLINE_QUEUE, payload: offlineQueue });
      dispatch({ type: START_OFFLINE_QUEUE });

      const { allowances = [] } = await storage.get('exchangeAllowances');
      dispatch({ type: SET_EXCHANGE_ALLOWANCES, payload: allowances });

      const { connectedProviders = [] } = await storage.get('exchangeProviders');
      dispatch({ type: SET_CONNECTED_EXCHANGE_PROVIDERS, payload: connectedProviders });

      const {
        agents = [],
        requiredAgentsCount = 0,
        transactions = [],
        enabled: accountRecoveryEnabled,
      } = await storage.get('accountRecovery');
      dispatch({ type: SET_ACCOUNT_RECOVERY_AGENTS, payload: { agents, requiredCount: requiredAgentsCount } });
      dispatch({ type: SET_ACCOUNT_RECOVERY_TRANSACTIONS, payload: transactions });
      if (accountRecoveryEnabled) dispatch({ type: SET_ACCOUNT_RECOVERY_ENABLED });

      await loadAndMigrate('history', dispatch, getState);

      if (appSettings.smartWalletUpgradeDismissed) {
        dispatch({ type: DISMISS_SMART_WALLET_UPGRADE });
      }

      const {
        upgradeTransferTransactions = [],
        upgradeStatus = null,
        accounts: smartAccounts = [],
        deploymentData = {},
        lastSyncedHash = null,
      } = await storage.get('smartWallet');
      dispatch({ type: SET_SMART_WALLET_ASSETS_TRANSFER_TRANSACTIONS, payload: upgradeTransferTransactions });
      dispatch({ type: SET_SMART_WALLET_UPGRADE_STATUS, payload: upgradeStatus });
      dispatch({ type: SET_SMART_WALLET_ACCOUNTS, payload: smartAccounts });
      dispatch({ type: SET_SMART_WALLET_DEPLOYMENT_DATA, payload: deploymentData });
      dispatch({ type: SET_SMART_WALLET_LAST_SYNCED_HASH, payload: lastSyncedHash });

      dispatch({ type: UPDATE_APP_SETTINGS, payload: appSettings });

      if (wallet.backupStatus) dispatch({ type: UPDATE_WALLET_IMPORT_STATE, payload: wallet.backupStatus });

      navigate(NavigationActions.navigate({ routeName: AUTH_FLOW }));
      return;
    }
    dispatch({ type: UPDATE_APP_SETTINGS, payload: appSettings });
    navigate(NavigationActions.navigate({ routeName: ONBOARDING_FLOW }));
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

export const repairStorageAction = () => {
  return async (dispatch: Function) => {
    await storage.repair();
    dispatch({
      type: ADD_NOTIFICATION,
      payload: {
        message: 'Local storage repaired',
      },
    });
    dispatch({
      type: UPDATE_SESSION,
      payload: { hasDBConflicts: false },
    });
  };
};
