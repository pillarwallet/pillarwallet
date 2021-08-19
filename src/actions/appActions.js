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
import Instabug from 'instabug-reactnative';

// services
import Storage from 'services/storage';
import { navigate } from 'services/navigation';
import { migrate } from 'services/dataMigration';

// constants
import { IS_APP_VERSION_V3 } from 'constants/appConstants';
import { AUTH_FLOW, ONBOARDING_FLOW, PIN_CODE_UNLOCK } from 'constants/navigationConstants';
import { RESET_APP_LOADED, UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import { SET_SUPPORTED_ASSETS } from 'constants/assetsConstants';
import { SET_ASSETS_BALANCES } from 'constants/assetsBalancesConstants';
import { UPDATE_PIN_ATTEMPTS, UPDATE_WALLET_BACKUP_STATUS } from 'constants/walletConstants';
import { UPDATE_TX_COUNT } from 'constants/txCountConstants';
import { SET_COLLECTIBLES, SET_COLLECTIBLES_TRANSACTION_HISTORY } from 'constants/collectiblesConstants';
import { SET_RATES } from 'constants/ratesConstants';
import { UPDATE_OFFLINE_QUEUE, START_OFFLINE_QUEUE } from 'constants/offlineQueueConstants';
import { UPDATE_ACCOUNTS } from 'constants/accountsConstants';
import {
  SET_ARCHANOVA_WALLET_ACCOUNTS,
  SET_ARCHANOVA_WALLET_DEPLOYMENT_DATA,
  SET_ARCHANOVA_WALLET_UPGRADE_STATUS,
  SET_ARCHANOVA_WALLET_LAST_SYNCED_PAYMENT_ID,
  SET_ARCHANOVA_WALLET_LAST_SYNCED_TRANSACTION_ID,
} from 'constants/archanovaConstants';
import { SET_INSIGHTS_STATE } from 'constants/insightsConstants';
import {
  UPDATE_PAYMENT_NETWORK_BALANCES,
  UPDATE_PAYMENT_NETWORK_STAKED,
  MARK_PLR_TANK_INITIALISED,
} from 'constants/paymentNetworkConstants';
import { SET_USER_SETTINGS } from 'constants/userSettingsConstants';
import { SET_WALLET_EVENTS } from 'constants/walletEventsConstants';
import { SET_ENS_REGISTRY_RECORDS } from 'constants/ensRegistryConstants';
import { SET_KEY_BASED_ASSETS_TO_TRANSFER } from 'constants/keyBasedAssetTransferConstants';
import { SET_CONTACTS } from 'constants/contactsConstants';
import { SET_CACHED_URLS } from 'constants/cacheConstants';
import { SET_HISTORY_LAST_SYNC_IDS } from 'constants/historyConstants';
import { SET_TOTAL_BALANCES } from 'constants/totalsBalancesConstants';

// utils
import { getWalletFromStorage } from 'utils/wallet';
import { findFirstArchanovaAccount, findFirstEtherspotAccount, getAccountAddress } from 'utils/accounts';

// selectors
import { accountsSelector, activeAccountAddressSelector } from 'selectors';

// actions
import { getTranslationsResourcesAndSetLanguageOnAppOpenAction } from 'actions/localisationActions';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';


const storage = Storage.getInstance('db');

export const initAppAndRedirectAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: RESET_APP_LOADED });

    let storageData = await storage.getAll();
    await storage.migrateFromPouchDB(storageData);

    storageData = await migrate('app_settings', storageData, dispatch, getState, 'appSettings');
    const { appSettings = {} } = get(storageData, 'app_settings', {});

    // $FlowFixMe
    const { wallet, walletTimestamp } = await getWalletFromStorage(storageData, dispatch);

    if (walletTimestamp) {
      // migrations
      storageData = await migrate('collectibles', storageData, dispatch, getState);
      storageData = await migrate('collectiblesHistory', storageData, dispatch, getState);
      storageData = await migrate('history', storageData, dispatch, getState);
      storageData = await migrate('supportedAssets', storageData, dispatch, getState);
      storageData = await migrate('rates', storageData, dispatch, getState);

      const { accounts = [] } = get(storageData, 'accounts', {});
      dispatch({ type: UPDATE_ACCOUNTS, payload: accounts });

      const supportedAssets = storageData?.supportedAssets?.supportedAssets ?? {};
      dispatch({ type: SET_SUPPORTED_ASSETS, payload: supportedAssets });

      const assetsBalances = storageData?.assetsBalances?.data ?? {};
      dispatch({ type: SET_ASSETS_BALANCES, payload: assetsBalances });

      const rates = storageData?.rates?.rates ?? {};
      dispatch({ type: SET_RATES, payload: rates });

      const { txCount = {} } = get(storageData, 'txCount', {});
      dispatch({ type: UPDATE_TX_COUNT, payload: txCount });

      const { collectibles = {} } = get(storageData, 'collectibles', {});
      dispatch({ type: SET_COLLECTIBLES, payload: collectibles });

      const { collectiblesHistory = {} } = get(storageData, 'collectiblesHistory', {});
      dispatch({ type: SET_COLLECTIBLES_TRANSACTION_HISTORY, payload: collectiblesHistory });

      const { paymentNetworkBalances = {} } = get(storageData, 'paymentNetworkBalances', {});
      dispatch({ type: UPDATE_PAYMENT_NETWORK_BALANCES, payload: paymentNetworkBalances });

      const { paymentNetworkStaked = '' } = get(storageData, 'paymentNetworkStaked', {});
      dispatch({ type: UPDATE_PAYMENT_NETWORK_STAKED, payload: paymentNetworkStaked });

      const { isPLRTankInitialised = false } = get(storageData, 'isPLRTankInitialised', {});
      if (isPLRTankInitialised) dispatch({ type: MARK_PLR_TANK_INITIALISED });

      const { offlineQueue = [] } = get(storageData, 'offlineQueue', {});
      dispatch({ type: UPDATE_OFFLINE_QUEUE, payload: offlineQueue });
      dispatch({ type: START_OFFLINE_QUEUE });

      const { userSettings = {} } = get(storageData, 'userSettings', {});
      dispatch({ type: SET_USER_SETTINGS, payload: userSettings });

      const walletEvents = storageData?.walletEvents?.walletEvents ?? {};
      dispatch({ type: SET_WALLET_EVENTS, payload: walletEvents });

      const { insights = {} } = get(storageData, 'insights', {});
      dispatch({ type: SET_INSIGHTS_STATE, payload: insights });

      const { keyBasedAssetsToTransfer = [] } = get(storageData, 'keyBasedAssetTransfer', []);
      dispatch({ type: SET_KEY_BASED_ASSETS_TO_TRANSFER, payload: keyBasedAssetsToTransfer });

      const { contacts = [] } = get(storageData, 'localContacts', []);
      dispatch({ type: SET_CONTACTS, payload: contacts });

      const totalBalances = storageData?.totalBalances?.data ?? {};
      dispatch({ type: SET_TOTAL_BALANCES, payload: totalBalances });

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
      dispatch({ type: SET_ARCHANOVA_WALLET_UPGRADE_STATUS, payload: upgradeStatus });
      dispatch({ type: SET_ARCHANOVA_WALLET_ACCOUNTS, payload: smartAccounts });
      dispatch({ type: SET_ARCHANOVA_WALLET_DEPLOYMENT_DATA, payload: deploymentData });
      dispatch({ type: SET_ARCHANOVA_WALLET_LAST_SYNCED_PAYMENT_ID, payload: lastSyncedPaymentId });
      dispatch({ type: SET_ARCHANOVA_WALLET_LAST_SYNCED_TRANSACTION_ID, payload: lastSyncedTransactionId });

      const { ensRegistry = {} } = get(storageData, 'ensRegistry', {});
      dispatch({ type: SET_ENS_REGISTRY_RECORDS, payload: ensRegistry });

      if (wallet.backupStatus) dispatch({ type: UPDATE_WALLET_BACKUP_STATUS, payload: wallet.backupStatus });

      const historyLastSyncIds = get(storageData, 'historyLastSyncIds');
      if (historyLastSyncIds) dispatch({ type: SET_HISTORY_LAST_SYNC_IDS, payload: historyLastSyncIds });
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

    await dispatch(getTranslationsResourcesAndSetLanguageOnAppOpenAction());

    navigate(NavigationActions.navigate(navAction));

    SplashScreen.hide();
  };
};

export const setupSentryAction = (user: ?Object, wallet: Object) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const activeAccountAddress = activeAccountAddressSelector(getState());
    const accounts = accountsSelector(getState());

    const etherspotAccount = findFirstEtherspotAccount(accounts);
    const archanovaAccount = findFirstArchanovaAccount(accounts);

    const etherspotAccountAddress = etherspotAccount ? getAccountAddress(etherspotAccount) : null;
    const archanovaAccountAddress = archanovaAccount ? getAccountAddress(archanovaAccount) : null;

    const { username } = user || {};
    const { address: keyWalletAddress } = wallet;

    Sentry.setUser({
      username,
      extra: {
        keyWalletAddress,
        activeAccountAddress,
        etherspotAccountAddress,
        archanovaAccountAddress,
        [IS_APP_VERSION_V3]: true,
      },
    });

    /* eslint-disable i18next/no-literal-string */
    Instabug.setUserAttribute('keyWalletAddress', keyWalletAddress);
    Instabug.setUserAttribute('activeAccountAddress', activeAccountAddress);
    Instabug.setUserAttribute('etherspotAccountAddress', etherspotAccountAddress);
    Instabug.setUserAttribute('archanovaAccountAddress', archanovaAccountAddress);
    Instabug.setUserAttribute(IS_APP_VERSION_V3, 'true');
    /* eslint-enable i18next/no-literal-string */

    if (username) Instabug.setUserAttribute('ENS', username);
  };
};
