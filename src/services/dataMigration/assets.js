// @flow
import get from 'lodash.get';
import { saveDbAction } from 'actions/dbActions';
import type { Accounts } from 'models/Account';
import type { Assets, AssetsStore } from 'models/Asset';
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

export default async function (storageData: Object, dispatch: Function) {
  const { accounts = [] } = get(storageData, 'accounts', {});
  const { assets = {} } = get(storageData, 'assets', {});
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
