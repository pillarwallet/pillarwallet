// @flow
import get from 'lodash.get';
import { saveDbAction } from 'actions/dbActions';
import type { Accounts } from 'models/Account';
import type { Assets, AssetsStore } from 'models/Asset';

import Storage from 'services/storage';
import { findKeyBasedAccount } from 'utils/accounts';

const storage = Storage.getInstance('db');

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

export default async function (dispatch: Function) {
  const { accounts = [] } = await storage.get('accounts');
  const { assets = {} } = await storage.get('assets');
  const keyBasedAccount = findKeyBasedAccount(accounts);
  const keyBasedAccountId = get(keyBasedAccount, 'id', null);

  if (accounts.length && !assets[keyBasedAccountId]) {
    const migratedAssets = migrateAssetsToAccountsFormat(assets, accounts);
    if (migratedAssets) {
      dispatch(saveDbAction('assets', { assets: migratedAssets }, true));
      return migratedAssets;
    }
  }

  return assets;
}
