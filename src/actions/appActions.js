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
import * as Sentry from '@sentry/react-native';

// services
import Storage from 'services/storage';
import { navigate } from 'services/navigation';
import { loadAndMigrate } from 'services/dataMigration';

// constants
import { AUTH_FLOW, ONBOARDING_FLOW } from 'constants/navigationConstants';
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import {
  UPDATE_ASSETS,
  UPDATE_BALANCES,
  UPDATE_SUPPORTED_ASSETS,
} from 'constants/assetsConstants';
import { SET_CONTACTS_SMART_ADDRESSES, UPDATE_CONTACTS } from 'constants/contactsConstants';
import { UPDATE_INVITATIONS } from 'constants/invitationsConstants';
import { UPDATE_WALLET_IMPORT_STATE, UPDATE_PIN_ATTEMPTS } from 'constants/walletConstants';
import { UPDATE_OAUTH_TOKENS } from 'constants/oAuthConstants';
import { UPDATE_TX_COUNT } from 'constants/txCountConstants';
import { UPDATE_COLLECTIBLES, SET_COLLECTIBLES_TRANSACTION_HISTORY } from 'constants/collectiblesConstants';
import { UPDATE_BADGES, SET_CONTACTS_BADGES, SET_BADGE_AWARD_EVENTS } from 'constants/badgesConstants';
import { UPDATE_RATES } from 'constants/ratesConstants';
import { UPDATE_OFFLINE_QUEUE, START_OFFLINE_QUEUE } from 'constants/offlineQueueConstants';
import {
  SET_EXCHANGE_ALLOWANCES,
  SET_CONNECTED_EXCHANGE_PROVIDERS,
  SET_EXCHANGE_SUPPORTED_ASSETS,
  SET_EXCHANGE_PROVIDERS_METADATA,
  SET_FIAT_EXCHANGE_SUPPORTED_ASSETS,
} from 'constants/exchangeConstants';
import { UPDATE_ACCOUNTS } from 'constants/accountsConstants';
import {
  SET_SMART_WALLET_ACCOUNTS,
  SET_SMART_WALLET_ASSETS_TRANSFER_TRANSACTIONS,
  SET_SMART_WALLET_DEPLOYMENT_DATA,
  SET_SMART_WALLET_UPGRADE_STATUS,
  SET_SMART_WALLET_LAST_SYNCED_PAYMENT_ID,
  SET_SMART_WALLET_LAST_SYNCED_TRANSACTION_ID,
} from 'constants/smartWalletConstants';
import { SET_INSIGHTS_STATE } from 'constants/insightsConstants';
import {
  UPDATE_PAYMENT_NETWORK_BALANCES,
  UPDATE_PAYMENT_NETWORK_STAKED,
  MARK_PLR_TANK_INITIALISED,
} from 'constants/paymentNetworkConstants';
import { SET_USER_SETTINGS } from 'constants/userSettingsConstants';
import {
  INITIAL_FEATURE_FLAGS,
  SET_FEATURE_FLAGS,
} from 'constants/featureFlagsConstants';
import { SET_USER_EVENTS } from 'constants/userEventsConstants';
import { SET_ENS_REGISTRY_RECORDS } from 'constants/ensRegistryConstants';
import { SET_REMOVING_CONNECTED_DEVICE_ADDRESS } from 'constants/connectedDevicesConstants';


// utils
import { getWalletFromStorage } from 'utils/wallet';

// actions
import { loadBitcoinAddressesAction, loadBitcoinBalancesAction } from './bitcoinActions';


const storage = Storage.getInstance('db');

const BACKGROUND = 'background';
const ANDROID = 'android';

export const initAppAndRedirectAction = (appState: string, platform: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    // Appears that android back-handler on exit causes the app to mount once again.
    if (appState === BACKGROUND && platform === ANDROID) return;

    await storage.migrateFromPouchDB();

    // $FlowFixMe
    const appSettings = await loadAndMigrate('app_settings', dispatch, getState);
    // $FlowFixMe
    const { wallet, walletTimestamp } = await getWalletFromStorage(dispatch, appSettings, api);

    if (walletTimestamp) {
      const accounts = await loadAndMigrate('accounts', dispatch, getState);
      dispatch({ type: UPDATE_ACCOUNTS, payload: accounts });

      const assets = await loadAndMigrate('assets', dispatch, getState);
      dispatch({ type: UPDATE_ASSETS, payload: assets });

      const { supportedAssets = [] } = await storage.get('supportedAssets');
      dispatch({ type: UPDATE_SUPPORTED_ASSETS, payload: supportedAssets });

      const { exchangeSupportedAssets = [] } = await storage.get('exchangeSupportedAssets');
      dispatch({ type: SET_EXCHANGE_SUPPORTED_ASSETS, payload: exchangeSupportedAssets });

      const { fiatExchangeSupportedAssets = [] } = await storage.get('fiatExchangeSupportedAssets');
      dispatch({ type: SET_FIAT_EXCHANGE_SUPPORTED_ASSETS, payload: fiatExchangeSupportedAssets });

      const balances = await loadAndMigrate('balances', dispatch, getState);
      dispatch({ type: UPDATE_BALANCES, payload: balances });

      const { rates = {} } = await storage.get('rates');
      dispatch({ type: UPDATE_RATES, payload: rates });

      const { contacts = [] } = await storage.get('contacts');
      dispatch({ type: UPDATE_CONTACTS, payload: contacts });

      const { contactsSmartAddresses = [] } = await storage.get('contactsSmartAddresses');
      dispatch({ type: SET_CONTACTS_SMART_ADDRESSES, payload: contactsSmartAddresses });

      const { invitations = [] } = await storage.get('invitations');
      dispatch({ type: UPDATE_INVITATIONS, payload: invitations });

      const { oAuthTokens = {} } = await storage.get('oAuthTokens');
      dispatch({ type: UPDATE_OAUTH_TOKENS, payload: oAuthTokens });

      const { txCount = {} } = await storage.get('txCount');
      dispatch({ type: UPDATE_TX_COUNT, payload: txCount });

      const collectibles = await loadAndMigrate('collectibles', dispatch, getState);
      dispatch({ type: UPDATE_COLLECTIBLES, payload: collectibles });

      const collectiblesHistory = await loadAndMigrate('collectiblesHistory', dispatch, getState);
      dispatch({ type: SET_COLLECTIBLES_TRANSACTION_HISTORY, payload: collectiblesHistory });

      const { badges = [] } = await storage.get('badges');
      dispatch({ type: UPDATE_BADGES, payload: badges });

      const { contactsBadges = {} } = await storage.get('contactsBadges');
      dispatch({ type: SET_CONTACTS_BADGES, payload: contactsBadges });

      const { badgeAwardEvents = [] } = await storage.get('badgeAwardEvents');
      dispatch({ type: SET_BADGE_AWARD_EVENTS, payload: badgeAwardEvents });

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

      const { exchangeProvidersInfo = [] } = await storage.get('exchangeProvidersInfo');
      dispatch({ type: SET_EXCHANGE_PROVIDERS_METADATA, payload: exchangeProvidersInfo });

      const { userSettings = {} } = await storage.get('userSettings');
      dispatch({ type: SET_USER_SETTINGS, payload: userSettings });

      const { featureFlags = INITIAL_FEATURE_FLAGS } = await storage.get('featureFlags');
      dispatch({ type: SET_FEATURE_FLAGS, payload: featureFlags });

      const { userEvents = [] } = await storage.get('userEvents');
      dispatch({ type: SET_USER_EVENTS, payload: userEvents });

      const { removingConnectedDeviceAddress } = await storage.get('connectedDevices');
      dispatch({ type: SET_REMOVING_CONNECTED_DEVICE_ADDRESS, payload: removingConnectedDeviceAddress });

      const { insights = {} } = await storage.get('insights');
      dispatch({ type: SET_INSIGHTS_STATE, payload: insights });

      const { pinAttemptsCount = 0, lastPinAttempt = 0 } = wallet;
      dispatch({
        type: UPDATE_PIN_ATTEMPTS,
        payload: {
          pinAttemptsCount,
          lastPinAttempt,
        },
      });

      await loadAndMigrate('history', dispatch, getState);

      dispatch(loadBitcoinAddressesAction());

      dispatch(loadBitcoinBalancesAction());

      const {
        upgradeTransferTransactions = [],
        upgradeStatus = null,
        accounts: smartAccounts = [],
        deploymentData = {},
        lastSyncedPaymentId = null,
        lastSyncedTransactionId = null,
      } = await storage.get('smartWallet');
      dispatch({ type: SET_SMART_WALLET_ASSETS_TRANSFER_TRANSACTIONS, payload: upgradeTransferTransactions });
      dispatch({ type: SET_SMART_WALLET_UPGRADE_STATUS, payload: upgradeStatus });
      dispatch({ type: SET_SMART_WALLET_ACCOUNTS, payload: smartAccounts });
      dispatch({ type: SET_SMART_WALLET_DEPLOYMENT_DATA, payload: deploymentData });
      dispatch({ type: SET_SMART_WALLET_LAST_SYNCED_PAYMENT_ID, payload: lastSyncedPaymentId });
      dispatch({ type: SET_SMART_WALLET_LAST_SYNCED_TRANSACTION_ID, payload: lastSyncedTransactionId });

      const { ensRegistry = {} } = await storage.get('ensRegistry');
      dispatch({ type: SET_ENS_REGISTRY_RECORDS, payload: ensRegistry });

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
    Sentry.setUser({
      id,
      username,
      extra: {
        walletId,
        ethAddress: address,
      },
    });
  };
};
