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
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import omit from 'lodash.omit';
import t from 'translations/translate';

import type { Account, Accounts, AccountTypes } from 'models/Account';
import type { Assets, Balances, BalancesStore } from 'models/Asset';
import type { TranslatedString } from 'models/Translations';

import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { addressesEqual, getBalance } from './assets';

export const getActiveAccount = (accounts: Accounts): ?Account => {
  return accounts.find(({ isActive }) => isActive);
};

export const getInactiveUserAccounts = (accounts: Accounts): Accounts => {
  return accounts.filter(({ isActive }) => !isActive);
};

export const getActiveAccountId = (accounts: Accounts): string => {
  const activeAccount = getActiveAccount(accounts);
  if (!activeAccount) {
    return '';
  }

  return activeAccount.id;
};

export const getAccountId = (account: Account): string => {
  return get(account, 'id', '');
};

export const getAccountType = (account: Account): ?AccountTypes => {
  return account.type;
};

export const getActiveAccountType = (accounts: Accounts): ?AccountTypes => {
  const activeAccount = getActiveAccount(accounts);
  if (!activeAccount) {
    return null;
  }

  return getAccountType(activeAccount);
};

export const getAccountAddress = (account: Account): string => {
  return account.id;
};

export const getActiveAccountAddress = (accounts: Accounts): string => {
  const activeAccount = getActiveAccount(accounts);
  if (!activeAccount) {
    return '';
  }

  return getAccountAddress(activeAccount);
};

export const findKeyBasedAccount = (accounts: Accounts): ?Account => {
  return accounts.find(({ type }) => type === ACCOUNT_TYPES.KEY_BASED);
};

export const hasLegacyAccountBalance = (accounts: Accounts, balances: BalancesStore): boolean => {
  const account = findKeyBasedAccount(accounts);
  if (!account || isEmpty(balances[account.id])) {
    return false;
  }
  const accountBalances: Balances = balances[account.id];
  return Object.keys(accountBalances).some(token => getBalance(accountBalances, token) > 0);
};

export const findFirstSmartAccount = (accounts: Accounts): ?Account => {
  return accounts.find(({ type }) => type === ACCOUNT_TYPES.SMART_WALLET);
};

export const getActiveAccountWalletId = (accounts: Accounts): string => {
  const activeAccount = getActiveAccount(accounts);
  if (!activeAccount) {
    return '';
  }

  return activeAccount.walletId;
};

export const checkIfSmartWalletAccount = (account: Account): boolean => {
  return account.type === ACCOUNT_TYPES.SMART_WALLET;
};

export const checkIfKeyBasedAccount = (account: Account): boolean => {
  return account.type === ACCOUNT_TYPES.KEY_BASED;
};

export const getAccountName = (accountType: AccountTypes | TranslatedString): string => {
  switch (accountType) {
    case ACCOUNT_TYPES.SMART_WALLET:
      return t('smartWallet');
    case ACCOUNT_TYPES.KEY_BASED:
      return t('keyWallet');
    default:
      return '';
  }
};

export const findAccountByAddress = (address: string, accounts: Accounts): ?Account => {
  return accounts.find(account => addressesEqual(address, getAccountAddress(account)));
};

export const getAccountTypeByAddress = (address: string, accounts: Accounts): ?string => {
  const relatedAccount = findAccountByAddress(address, accounts);
  if (!relatedAccount) return null;
  return relatedAccount.type;
};

export const findAccountById = (accountId: string, accounts: Accounts): ?Account => {
  return accounts.find(({ id }) => id === accountId);
};

export const getAccountWalletId = (account: Account): string => {
  return get(account, 'walletId', '');
};

export const normalizeForEns = (value: string): string => {
  return value
    .toLowerCase()
    .replace(/ /g, '-');
};

export const getEnabledAssets = (allAccountAssets: Assets, hiddenAssets: string[]): Assets => {
  if (!isEmpty(allAccountAssets)) {
    return omit(allAccountAssets, hiddenAssets);
  }
  return {};
};

export const getEnsName = (accounts: Accounts): string => {
  const SWAccount = findFirstSmartAccount(accounts);
  return get(SWAccount, 'extra.ensName', '');
};

export const getKeyWalletAddress = (accounts: Accounts): ?string => {
  const kwAccount = findKeyBasedAccount(accounts);
  if (!kwAccount) return null;
  return getAccountAddress(kwAccount);
};

export const getSmartWalletAddress = (accounts: Accounts): ?string => {
  const swAccount = findFirstSmartAccount(accounts);
  if (!swAccount) return null;
  return getAccountAddress(swAccount);
};

const getSupportedAccountTypes = () => Object.values(ACCOUNT_TYPES);

export const isSupportedAccountType = (accountType: string) => getSupportedAccountTypes().includes(accountType);

export const getInitials = (fullName: string = '') => {
  return fullName
    .split(' ')
    .map(name => name.substring(0, 1))
    .join('')
    .toUpperCase();
};

export const isNotKeyBasedType = ({ type }) => type !== ACCOUNT_TYPES.KEY_BASED;
