// @flow
import get from 'lodash.get';
import { saveStorageAction } from 'actions/dbActions';
import type { Accounts } from 'models/Account';
import type { Assets, AssetsStore } from 'models/Asset';
import type { Dispatch } from 'reducers/rootReducer';

import Storage from 'services/storage';
import { findKeyBasedAccount } from 'utils/accounts';

export function migrateAssetsToAccountsFormat(
  assets: Assets,
  accounts: Accounts,
): ?AssetsStore {
  if (!accounts.length) return null;

  const assetsByAcc = {};
  accounts.forEach(({ id }) => {
    assetsByAcc[id] = assets;
  });

  return assetsByAcc;
}

export default async function (
  appStorage: Storage,
  dispatch: Dispatch,
) {
  const { accounts = [] } = await appStorage.get('accounts');
  const { assets = {} } = await appStorage.get('assets');
  const keyBasedAccount = findKeyBasedAccount(accounts);
  const keyBasedAccountId = get(keyBasedAccount, 'id', null);

  if (accounts.length && !assets[keyBasedAccountId]) {
    const migratedAssets = migrateAssetsToAccountsFormat(assets, accounts);
    if (migratedAssets) {
      dispatch(saveStorageAction(appStorage, 'assets', { assets: migratedAssets }, true));
    }
  }
}
