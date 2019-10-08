// @flow
import { saveStorageAction } from 'actions/dbActions';
import Storage from 'services/storage';
import { findKeyBasedAccount } from 'utils/accounts';
import { normalizeWalletAddress } from 'utils/wallet';
import { initDefaultAccountAction } from 'actions/accountsActions';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

import type { Accounts } from 'models/Account';
import type { Dispatch } from 'reducers/rootReducer';

function addWalletIdToKeyBasedAccount(accounts: Accounts, walletId: string) {
  return accounts.map(account => {
    if (account.type !== ACCOUNT_TYPES.KEY_BASED) return account;
    return {
      ...account,
      walletId,
    };
  });
}

export default async function (
  wallet: Object,
  appStorage: Storage,
  dispatch: Dispatch,
) {
  const { accounts = [] } = await appStorage.get('accounts');
  const { user = {} } = await appStorage.get('user');

  // wallet is not registered yet
  if (!user.walletId) return;

  if (!accounts.length) {
    await dispatch(initDefaultAccountAction(normalizeWalletAddress(wallet.address), user.walletId));

    return;
  }

  const keyBasedAccount = findKeyBasedAccount(accounts);

  if (keyBasedAccount && !keyBasedAccount.walletId) {
    const migratedAccounts = addWalletIdToKeyBasedAccount(accounts, user.walletId);

    dispatch(saveStorageAction(appStorage, 'accounts', { balances: migratedAccounts }, true));
  }
}
