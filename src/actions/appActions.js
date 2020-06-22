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
import { migrate } from 'services/dataMigration';

// constants
import { AUTH_FLOW, ONBOARDING_FLOW } from 'constants/navigationConstants';
import { RESET_APP_LOADED, UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
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
import { SET_DEPOSITED_ASSETS } from 'constants/lendingConstants';

// utils
import { getWalletFromStorage } from 'utils/wallet';

// actions
import { loadBitcoinAddressesAction, loadBitcoinBalancesAction } from './bitcoinActions';


const storage = Storage.getInstance('db');

export const initAppAndRedirectAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    dispatch({ type: RESET_APP_LOADED });

    let storageData = await storage.getAll();
    await storage.migrateFromPouchDB(storageData);

    storageData = await migrate('app_settings', storageData, dispatch, getState);
    const { appSettings = {} } = get(storageData, 'app_settings', {});

    // $FlowFixMe
    const { wallet, walletTimestamp } = await getWalletFromStorage(storageData, dispatch, api);
    const navigateRouteOnFinish = walletTimestamp ? AUTH_FLOW : ONBOARDING_FLOW;

    if (walletTimestamp) {
      // migrations
      storageData = await migrate('accounts', storageData, dispatch, getState);
      storageData = await migrate('assets', storageData, dispatch, getState);
      storageData = await migrate('balances', storageData, dispatch, getState);
      storageData = await migrate('collectibles', storageData, dispatch, getState);
      storageData = await migrate('collectiblesHistory', storageData, dispatch, getState);
      storageData = await migrate('history', storageData, dispatch, getState);

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

      const { contacts = [] } = get(storageData, 'contacts', {});
      dispatch({ type: UPDATE_CONTACTS, payload: contacts });

      const { contactsSmartAddresses = [] } = get(storageData, 'contactsSmartAddresses', {});
      dispatch({ type: SET_CONTACTS_SMART_ADDRESSES, payload: contactsSmartAddresses });

      const { invitations = [] } = get(storageData, 'invitations', {});
      dispatch({ type: UPDATE_INVITATIONS, payload: invitations });

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

      const { connectedProviders = [] } = get(storageData, 'exchangeProviders', {});
      dispatch({ type: SET_CONNECTED_EXCHANGE_PROVIDERS, payload: connectedProviders });

      const { exchangeProvidersInfo = [] } = get(storageData, 'exchangeProvidersInfo', {});
      dispatch({ type: SET_EXCHANGE_PROVIDERS_METADATA, payload: exchangeProvidersInfo });

      const { userSettings = {} } = get(storageData, 'userSettings', {});
      dispatch({ type: SET_USER_SETTINGS, payload: userSettings });

      const { featureFlags = INITIAL_FEATURE_FLAGS } = get(storageData, 'featureFlags', {});
      dispatch({ type: SET_FEATURE_FLAGS, payload: featureFlags });

      const { userEvents = [] } = get(storageData, 'userEvents', {});
      dispatch({ type: SET_USER_EVENTS, payload: userEvents });

      const { removingConnectedDeviceAddress = null } = get(storageData, 'connectedDevices', {});
      dispatch({ type: SET_REMOVING_CONNECTED_DEVICE_ADDRESS, payload: removingConnectedDeviceAddress });

      const { insights = {} } = get(storageData, 'insights', {});
      dispatch({ type: SET_INSIGHTS_STATE, payload: insights });

      const { depositedAssets = [] } = get(storageData, 'lending', []);
      dispatch({ type: SET_DEPOSITED_ASSETS, payload: depositedAssets });

      const { pinAttemptsCount = 0, lastPinAttempt = 0 } = wallet;
      dispatch({
        type: UPDATE_PIN_ATTEMPTS,
        payload: {
          pinAttemptsCount,
          lastPinAttempt,
        },
      });

      dispatch(loadBitcoinAddressesAction());

      dispatch(loadBitcoinBalancesAction());

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

      if (wallet.backupStatus) dispatch({ type: UPDATE_WALLET_IMPORT_STATE, payload: wallet.backupStatus });
    }

    dispatch({ type: UPDATE_APP_SETTINGS, payload: appSettings });
    navigate(NavigationActions.navigate({ routeName: navigateRouteOnFinish }));
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
