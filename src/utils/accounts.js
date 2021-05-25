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

// constants
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// types
import type { Account, AccountTypes } from 'models/Account';
import type { Assets } from 'models/Asset';
import type { TranslatedString } from 'models/Translations';

// local
import { addressesEqual } from './assets';


export const getActiveAccount = (accounts: Account[]): ?Account => {
  return accounts.find(({ isActive }) => isActive);
};

export const getInactiveUserAccounts = (accounts: Account[]): Account[] => {
  return accounts.filter(({ isActive }) => !isActive);
};

export const getActiveAccountId = (accounts: Account[]): string => {
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

export const getActiveAccountType = (accounts: Account[]): ?AccountTypes => {
  const activeAccount = getActiveAccount(accounts);
  if (!activeAccount) {
    return null;
  }

  return getAccountType(activeAccount);
};

export const getAccountAddress = (account: Account): string => {
  return account.id;
};

export const getActiveAccountAddress = (accounts: Account[]): ?string => {
  const activeAccount = getActiveAccount(accounts);
  if (!activeAccount) return null;

  return getAccountAddress(activeAccount);
};

export const findAccountByType = (
  accounts: Account[],
  accountType: AccountTypes,
): ?Account => accounts.find(({ type }) => type === accountType);

export const findKeyBasedAccount = (accounts: Account[]): ?Account =>
  findAccountByType(accounts, ACCOUNT_TYPES.KEY_BASED);

export const findFirstArchanovaAccount = (accounts: Account[]): ?Account =>
  findAccountByType(accounts, ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET);

export const findFirstEtherspotAccount = (accounts: Account[]): ?Account =>
  findAccountByType(accounts, ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET);

export const findFirstSmartWalletAccount = (accounts: Account[]): ?Account =>
  findAccountByType(accounts, ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET) ||
  findAccountByType(accounts, ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET);

export const getActiveAccountWalletId = (accounts: Account[]): string => {
  const activeAccount = getActiveAccount(accounts);
  if (!activeAccount) {
    return '';
  }

  return activeAccount.walletId;
};

export const isSmartWalletAccount = (account: ?Account): boolean => [
  ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET,
  ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET,
].includes(account?.type);

export const isAccountType = (account: ?Account, type: AccountTypes): boolean %checks =>
  // Note: null checks has to be done separately or flow predicate function is not working correctly.
  account != null && account.type === type;

export const isArchanovaAccount = (account: ?Account): boolean %checks =>
  isAccountType(account, ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET);

export const isEtherspotAccount = (account: ?Account): boolean %checks =>
  isAccountType(account, ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET);

export const getAccountName = (accountType: AccountTypes | TranslatedString): string => {
  switch (accountType) {
    case ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET:
      return t('legacySmartWallet');
    case ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET:
      return t('smartWallet');
    default:
      return '';
  }
};

export const findAccountByAddress = (address: string, accounts: Account[]): ?Account => {
  return accounts.find((account) => addressesEqual(address, getAccountAddress(account)));
};

export const getAccountTypeByAddress = (address: string, accounts: Account[]): ?string => {
  const relatedAccount = findAccountByAddress(address, accounts);
  if (!relatedAccount) return null;
  return relatedAccount.type;
};

export const findAccountById = (accountId: string, accounts: Account[]): ?Account => {
  return accounts.find(({ id }) => id === accountId);
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

export const getAccountEnsName = (account: ?Account): ?string => {
  if (!account) return null;

  switch (account.type) {
    case ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET:
      return account.extra?.ethereum?.ensNode?.name;
    case ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET:
      return account.extra?.ensName;
    default:
      return null;
  }
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

export const isNotKeyBasedType = ({ type }: Account) => type !== ACCOUNT_TYPES.KEY_BASED;

export const isArchanovaAccountAddress = (address: string, accounts: Account[]): boolean =>
  getAccountTypeByAddress(address, accounts) === ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET;
