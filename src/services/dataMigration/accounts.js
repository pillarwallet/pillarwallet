// @flow
import { saveDbAction } from 'actions/dbActions';
import type { Accounts } from 'models/Account';
import Storage from 'services/storage';
import { findKeyBasedAccount } from 'utils/accounts';
import { normalizeWalletAddress } from 'utils/wallet';
import { initDefaultAccountAction } from 'actions/accountsActions';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

const storage = Storage.getInstance('db');

function addWalletIdToKeyBasedAccount(accounts: Accounts, walletId: string): Accounts {
  return accounts.map(account => {
    if (account.type !== ACCOUNT_TYPES.KEY_BASED) return account;
    return {
      ...account,
      walletId,
    };
  });
}

export default async function (dispatch: Function, getState: Function) {
  const { accounts = [] } = await storage.get('accounts');
  const { wallet } = await storage.get('wallet');
  const { user = {} } = await storage.get('user');

  // wallet is not registered yet
  if (!user.walletId) return accounts;

  if (!accounts.length) {
    await dispatch(initDefaultAccountAction(normalizeWalletAddress(wallet.address), user.walletId));
    const { accounts: { data: migratedAccounts } } = getState();
    return migratedAccounts;
  }

  const keyBasedAccount = findKeyBasedAccount(accounts);

  if (keyBasedAccount && !keyBasedAccount.walletId) {
    const migratedAccounts = addWalletIdToKeyBasedAccount(accounts, user.walletId);
    dispatch(saveDbAction('accounts', { balances: migratedAccounts }, true));
    return migratedAccounts;
  }

  return accounts;
}
