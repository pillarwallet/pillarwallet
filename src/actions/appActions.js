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
import get from 'lodash.get';
import SplashScreen from 'react-native-splash-screen';

// services
import Storage from 'services/storage';
import { navigate } from 'services/navigation';
// import { migrate } from 'services/dataMigration';
import { firebaseAuth, firebaseDb } from 'services/firebase';

// constants
import { AUTH_FLOW, ONBOARDING_FLOW, PIN_CODE_UNLOCK } from 'constants/navigationConstants';
import { RESET_APP_LOADED, UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { UPDATE_ASSETS, UPDATE_BALANCES, UPDATE_SUPPORTED_ASSETS } from 'constants/assetsConstants';
import { UPDATE_PIN_ATTEMPTS, UPDATE_WALLET_BACKUP_STATUS } from 'constants/walletConstants';
import { UPDATE_OAUTH_TOKENS } from 'constants/oAuthConstants';
import { UPDATE_TX_COUNT } from 'constants/txCountConstants';
import { UPDATE_COLLECTIBLES, SET_COLLECTIBLES_TRANSACTION_HISTORY } from 'constants/collectiblesConstants';
import { UPDATE_BADGES, SET_CONTACTS_BADGES, SET_BADGE_AWARD_EVENTS } from 'constants/badgesConstants';
import { UPDATE_RATES } from 'constants/ratesConstants';
import { UPDATE_OFFLINE_QUEUE, START_OFFLINE_QUEUE } from 'constants/offlineQueueConstants';
import {
  SET_EXCHANGE_ALLOWANCES,
  SET_EXCHANGE_SUPPORTED_ASSETS,
  SET_FIAT_EXCHANGE_SUPPORTED_ASSETS,
} from 'constants/exchangeConstants';
import { UPDATE_ACCOUNTS } from 'constants/accountsConstants';
import {
  SET_SMART_WALLET_ACCOUNTS,
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
import { SET_USER_EVENTS } from 'constants/userEventsConstants';
import { SET_ENS_REGISTRY_RECORDS } from 'constants/ensRegistryConstants';
import { SET_REMOVING_CONNECTED_DEVICE_ADDRESS } from 'constants/connectedDevicesConstants';
import { SET_LENDING_DEPOSITED_ASSETS } from 'constants/lendingConstants';
import { SET_KEY_BASED_ASSETS_TO_TRANSFER } from 'constants/keyBasedAssetTransferConstants';
import { SET_STREAMS } from 'constants/sablierConstants';
import { SET_CONTACTS } from 'constants/contactsConstants';
import { SET_CACHED_URLS } from 'constants/cacheConstants';

// utils
import { getWalletFromStorage } from 'utils/wallet';

// actions
import { getTranslationsResourcesAndSetLanguageOnAppOpen } from 'actions/localisationActions';


export const initAppAndRedirectAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    dispatch({ type: RESET_APP_LOADED });

    await firebaseAuth.signInAnonymously();
    await firebaseDb.setPersistenceEnabled(true);
    const storage = await Storage.getInstance('db');

    const storageData = await storage.getAll();
    await storage.migrateFromPouchDB(storageData);

    // storageData = await migrate('app_settings', storageData, dispatch, getState);
    const { appSettings = {} } = get(storageData, 'app_settings', {});

    // $FlowFixMe
    const { wallet, walletTimestamp } = await getWalletFromStorage(storageData, dispatch, api);

    if (walletTimestamp) {
      // migrations
      // storageData = await migrate('accounts', storageData, dispatch, getState);
      // storageData = await migrate('assets', storageData, dispatch, getState);
      // storageData = await migrate('balances', storageData, dispatch, getState);
      // storageData = await migrate('collectibles', storageData, dispatch, getState);
      // storageData = await migrate('collectiblesHistory', storageData, dispatch, getState);
      // storageData = await migrate('history', storageData, dispatch, getState);

      const { accounts = [] } = get(storageData, 'accounts', {});
      dispatch({ type: UPDATE_ACCOUNTS, payload: accounts });

      const { assets = {} } = get(storageData, 'assets', {});
      dispatch({ type: UPDATE_ASSETS, payload: assets });

      const { supportedAssets = [] } = get(storageData, 'supportedAssets', {});
      dispatch({ type: UPDATE_SUPPORTED_ASSETS, payload: supportedAssets });

      const { exchangeSupportedAssets = [] } = get(storageData, 'exchangeSupportedAssets', {});
      dispatch({ type: SET_EXCHANGE_SUPPORTED_ASSETS, payload: exchangeSupportedAssets });

      const { fiatExchangeSupportedAssets = [] } = get(storageData, 'fiatExchangeSupportedAssets', {});
      dispatch({ type: SET_FIAT_EXCHANGE_SUPPORTED_ASSETS, payload: fiatExchangeSupportedAssets });

      const { balances = {} } = get(storageData, 'balances', {});
      dispatch({ type: UPDATE_BALANCES, payload: balances });

      const { rates = {} } = get(storageData, 'rates', {});
      dispatch({ type: UPDATE_RATES, payload: rates });

      const { oAuthTokens = {} } = get(storageData, 'oAuthTokens', {});
      dispatch({ type: UPDATE_OAUTH_TOKENS, payload: oAuthTokens });

      const { txCount = {} } = get(storageData, 'txCount', {});
      dispatch({ type: UPDATE_TX_COUNT, payload: txCount });

      const { collectibles = {} } = get(storageData, 'collectibles', {});
      dispatch({ type: UPDATE_COLLECTIBLES, payload: collectibles });

      const { collectiblesHistory = {} } = get(storageData, 'collectiblesHistory', {});
      dispatch({ type: SET_COLLECTIBLES_TRANSACTION_HISTORY, payload: collectiblesHistory });

      const { badges = [] } = get(storageData, 'badges', {});
      dispatch({ type: UPDATE_BADGES, payload: badges });

      const { contactsBadges = {} } = get(storageData, 'contactsBadges', {});
      dispatch({ type: SET_CONTACTS_BADGES, payload: contactsBadges });

      const { badgeAwardEvents = [] } = get(storageData, 'badgeAwardEvents', {});
      dispatch({ type: SET_BADGE_AWARD_EVENTS, payload: badgeAwardEvents });

      const { paymentNetworkBalances = {} } = get(storageData, 'paymentNetworkBalances', {});
      dispatch({ type: UPDATE_PAYMENT_NETWORK_BALANCES, payload: paymentNetworkBalances });

      const { paymentNetworkStaked = '' } = get(storageData, 'paymentNetworkStaked', {});
      dispatch({ type: UPDATE_PAYMENT_NETWORK_STAKED, payload: paymentNetworkStaked });

      const { isPLRTankInitialised = false } = get(storageData, 'isPLRTankInitialised', {});
      if (isPLRTankInitialised) dispatch({ type: MARK_PLR_TANK_INITIALISED });

      const { offlineQueue = [] } = get(storageData, 'offlineQueue', {});
      dispatch({ type: UPDATE_OFFLINE_QUEUE, payload: offlineQueue });
      dispatch({ type: START_OFFLINE_QUEUE });

      const { allowances = [] } = get(storageData, 'exchangeAllowances', {});
      dispatch({ type: SET_EXCHANGE_ALLOWANCES, payload: allowances });

      const { userSettings = {} } = get(storageData, 'userSettings', {});
      dispatch({ type: SET_USER_SETTINGS, payload: userSettings });

      const { userEvents = [] } = get(storageData, 'userEvents', {});
      dispatch({ type: SET_USER_EVENTS, payload: userEvents });

      const { removingConnectedDeviceAddress = null } = get(storageData, 'connectedDevices', {});
      dispatch({ type: SET_REMOVING_CONNECTED_DEVICE_ADDRESS, payload: removingConnectedDeviceAddress });

      const { insights = {} } = get(storageData, 'insights', {});
      dispatch({ type: SET_INSIGHTS_STATE, payload: insights });

      const { depositedAssets = [] } = get(storageData, 'lending', []);
      dispatch({ type: SET_LENDING_DEPOSITED_ASSETS, payload: depositedAssets });

      const { keyBasedAssetsToTransfer = [] } = get(storageData, 'keyBasedAssetTransfer', []);
      dispatch({ type: SET_KEY_BASED_ASSETS_TO_TRANSFER, payload: keyBasedAssetsToTransfer });

      // "|| {}" is fix for users when we released a version where Sablier streams were incoming as nulls
      const { incomingStreams = [], outgoingStreams = [] } = get(storageData, 'sablier', {}) || {};
      dispatch({ type: SET_STREAMS, payload: { incomingStreams, outgoingStreams } });

      const { contacts = [] } = get(storageData, 'localContacts', []);
      dispatch({ type: SET_CONTACTS, payload: contacts });

      const { pinAttempt = {} } = get(storageData, 'pinAttempt', {});
      const { pinAttemptsCount = 0, lastPinAttempt = 0 } = pinAttempt;
      dispatch({
        type: UPDATE_PIN_ATTEMPTS,
        payload: {
          pinAttemptsCount,
          lastPinAttempt,
        },
      });

      const {
        upgradeStatus = null,
        accounts: smartAccounts = [],
        deploymentData = {},
        lastSyncedPaymentId = null,
        lastSyncedTransactionId = null,
      } = get(storageData, 'smartWallet', {});
      dispatch({ type: SET_SMART_WALLET_UPGRADE_STATUS, payload: upgradeStatus });
      dispatch({ type: SET_SMART_WALLET_ACCOUNTS, payload: smartAccounts });
      dispatch({ type: SET_SMART_WALLET_DEPLOYMENT_DATA, payload: deploymentData });
      dispatch({ type: SET_SMART_WALLET_LAST_SYNCED_PAYMENT_ID, payload: lastSyncedPaymentId });
      dispatch({ type: SET_SMART_WALLET_LAST_SYNCED_TRANSACTION_ID, payload: lastSyncedTransactionId });

      const { ensRegistry = {} } = get(storageData, 'ensRegistry', {});
      dispatch({ type: SET_ENS_REGISTRY_RECORDS, payload: ensRegistry });

      if (wallet.backupStatus) dispatch({ type: UPDATE_WALLET_BACKUP_STATUS, payload: wallet.backupStatus });
    }

    dispatch({ type: UPDATE_APP_SETTINGS, payload: appSettings });

    let navAction;
    if (walletTimestamp) {
      navAction = {
        routeName: AUTH_FLOW,
        action: NavigationActions.navigate({
          routeName: PIN_CODE_UNLOCK,
          params: {
            omitPin: appSettings.omitPinOnLogin,
          },
        }),
      };
    } else {
      navAction = { routeName: ONBOARDING_FLOW };
    }

    const { cachedUrls = {} } = get(storageData, 'cachedUrls', {});
    dispatch({ type: SET_CACHED_URLS, payload: cachedUrls });

    await dispatch(getTranslationsResourcesAndSetLanguageOnAppOpen());

    navigate(NavigationActions.navigate(navAction));

    SplashScreen.hide();
  };
};

export const setupSentryAction = (user: ?Object, wallet: Object) => {
  return async () => {
    const { id, username, walletId = '' } = user || {};
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
