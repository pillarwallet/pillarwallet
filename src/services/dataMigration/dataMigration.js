// @flow
import Storage from 'services/storage';
import { saveStorageAction } from 'actions/dbActions';

import type { Dispatch } from 'reducers/rootReducer';
import { getWalletFromStorage } from 'utils/wallet';

import loadAndMigrateAppSettings from './appSettings';
import loadAndMigrateAccounts from './accounts';
import loadAndMigrateBalances from './balances';
import loadAndMigrateHistory from './history';
import loadAndMigrateCollectibles from './collectibles';
import loadAndMigrateCollectiblesHistory from './collectiblesHistory';
import loadAndMigrateAssets from './assets';

const currentDataVersion = (
  appSettings: Object,
): number => {
  if (appSettings.lastTxSyncDatetime) {
    return 1;
  }

  if (appSettings.lastTxSyncDatetimes) {
    return 2;
  }

  if (appSettings.dataVersion) {
    return appSettings.dataVersion;
  }

  return 0;
};

const migrateToV2 = async (
  appSettings: Object,
  appStorage: Storage,
  dispatch: Dispatch,
) => {
  const { wallet, walletTimestamp } = await getWalletFromStorage(
    appSettings,
    appStorage,
    dispatch,
  );

  if (walletTimestamp) {
    await loadAndMigrateAppSettings(appSettings, wallet, appStorage, dispatch);
    await loadAndMigrateAccounts(wallet, appStorage, dispatch);
    await loadAndMigrateAssets(appStorage, dispatch);
    await loadAndMigrateBalances(appStorage, dispatch);
    await loadAndMigrateCollectibles(appStorage, dispatch);
    await loadAndMigrateCollectiblesHistory(appStorage, dispatch);
    await loadAndMigrateHistory(appStorage, dispatch);
  }
};

const migrateToV3 = async (
  appStorage: Storage,
  networkStorage: Storage,
  dispatch: Dispatch,
) => {
  const { history = {} } = await appStorage.get('history');
  const { accounts = [] } = await appStorage.get('accounts');
  const { assets = {} } = await appStorage.get('assets');
  const { balances = {} } = await appStorage.get('balances');
  const { contacts = [] } = await appStorage.get('contacts');
  const { contactsSmartAddresses = [] } = await appStorage.get('contactsSmartAddresses');
  const { invitations = [] } = await appStorage.get('invitations');
  const { accessTokens = [] } = await appStorage.get('accessTokens');
  const { oAuthTokens = {} } = await appStorage.get('oAuthTokens');
  const { txCount = {} } = await appStorage.get('txCount');
  const { connectionKeyPairs = [] } = await appStorage.get('connectionKeyPairs');
  const { connectionIdentityKeys = [] } = await appStorage.get('connectionIdentityKeys');
  const { collectibles = {} } = await appStorage.get('collectibles');
  const { collectiblesHistory = {} } = await appStorage.get('collectiblesHistory');
  const { badges = [] } = await appStorage.get('badges');
  const { contactsBadges = {} } = await appStorage.get('contactsBadges');
  const { paymentNetworkBalances = {} } = await appStorage.get('paymentNetworkBalances');
  const { paymentNetworkStaked = '' } = await appStorage.get('paymentNetworkStaked');
  const { isPLRTankInitialised = false } = await appStorage.get('isPLRTankInitialised');
  const { offlineQueue = [] } = await appStorage.get('offlineQueue');
  const { allowances = [] } = await appStorage.get('exchangeAllowances');
  const { connectedProviders = [] } = await appStorage.get('exchangeProviders');
  const { userSettings = {} } = await appStorage.get('userSettings');
  const smartWallet = await networkStorage.get('smartWallet');

  dispatch(saveStorageAction(networkStorage, 'history', { history }, true));
  dispatch(saveStorageAction(networkStorage, 'accounts', { accounts }, true));
  dispatch(saveStorageAction(networkStorage, 'assets', { assets }, true));
  dispatch(saveStorageAction(networkStorage, 'balances', { balances }, true));
  dispatch(saveStorageAction(networkStorage, 'contacts', { contacts }, true));
  dispatch(saveStorageAction(networkStorage, 'contactsSmartAddresses', { contactsSmartAddresses }, true));
  dispatch(saveStorageAction(networkStorage, 'invitations', { invitations }, true));
  dispatch(saveStorageAction(networkStorage, 'accessTokens', { accessTokens }, true));
  dispatch(saveStorageAction(networkStorage, 'oAuthTokens', { oAuthTokens }, true));
  dispatch(saveStorageAction(networkStorage, 'txCount', { txCount }, true));
  dispatch(saveStorageAction(networkStorage, 'connectionKeyPairs', { connectionKeyPairs }, true));
  dispatch(saveStorageAction(networkStorage, 'connectionIdentityKeys', { connectionIdentityKeys }, true));
  dispatch(saveStorageAction(networkStorage, 'collectibles', { collectibles }, true));
  dispatch(saveStorageAction(networkStorage, 'collectiblesHistory', { collectiblesHistory }, true));
  dispatch(saveStorageAction(networkStorage, 'badges', { badges }, true));
  dispatch(saveStorageAction(networkStorage, 'contactsBadges', { contactsBadges }, true));
  dispatch(saveStorageAction(networkStorage, 'paymentNetworkBalances', { paymentNetworkBalances }, true));
  dispatch(saveStorageAction(networkStorage, 'paymentNetworkStaked', { paymentNetworkStaked }, true));
  dispatch(saveStorageAction(networkStorage, 'isPLRTankInitialised', { isPLRTankInitialised }, true));
  dispatch(saveStorageAction(networkStorage, 'offlineQueue', { offlineQueue }, true));
  dispatch(saveStorageAction(networkStorage, 'exchangeAllowances', { allowances }, true));
  dispatch(saveStorageAction(networkStorage, 'exchangeProviders', { connectedProviders }, true));
  dispatch(saveStorageAction(networkStorage, 'userSettings', { userSettings }, true));
  dispatch(saveStorageAction(networkStorage, 'smartWallet', smartWallet, true));
};

export const migrateStorage = async (
  appSettings: Object,
  appStorage: Storage,
  networkStorage: Storage,
  dispatch: Dispatch,
) => {
  const dataVersion = currentDataVersion(appSettings);

  switch (dataVersion) {
    case 1:
      migrateToV2(appSettings, appStorage, dispatch);
      break;

    case 2:
      migrateToV3(appStorage, networkStorage, dispatch);
      break;

    default:
      break;
  }
};
