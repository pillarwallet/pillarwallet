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

// constants
import { UPDATE_ACCOUNTS, ACCOUNT_TYPES, CHANGING_ACCOUNT } from 'constants/accountsConstants';
import { BLOCKCHAIN_NETWORK_TYPES, SET_ACTIVE_NETWORK } from 'constants/blockchainNetworkConstants';

// actions
import { checkForMissedAssetsAction, fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchCollectiblesAction } from 'actions/collectiblesActions';
import { saveDbAction } from 'actions/dbActions';
import { fetchTransactionsHistoryAction } from 'actions/historyActions';
import {
  checkIfSmartWalletWasRegisteredAction,
  connectSmartWalletAccountAction,
  initSmartWalletSdkAction,
  fetchVirtualAccountBalanceAction,
} from 'actions/smartWalletActions';
import { setActiveBlockchainNetworkAction } from 'actions/blockchainNetworkActions';
import { checkUserENSNameAction } from 'actions/ensRegistryActions';

// utils
import {
  findFirstLegacySmartAccount,
  getAccountId,
  getActiveAccountType,
  isSupportedAccountType,
} from 'utils/accounts';
import { isSupportedBlockchain } from 'utils/blockchainNetworks';

// selectors
import { activeAccountSelector } from 'selectors';

// types
import type { AccountExtra, AccountTypes } from 'models/Account';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import { reportErrorLog } from 'utils/common';


export const addAccountAction = (
  accountAddress: string,
  type: AccountTypes,
  accountExtra?: AccountExtra,
  backendAccounts: Object[] = [],
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();
    const smartWalletAccount = {
      id: accountAddress,
      type,
      extra: accountExtra,
      isActive: false,
      walletId: '',
    };

    const existingAccount = accounts.find(account => account.id.toLowerCase() === accountAddress.toLowerCase());
    const updatedAccounts = accounts.filter(account => account.id.toLowerCase() !== accountAddress.toLowerCase());
    const backendAccount = backendAccounts.find(({ ethAddress }) =>
      ethAddress.toLowerCase() === accountAddress.toLowerCase());

    if (backendAccount) {
      smartWalletAccount.walletId = backendAccount.id;
    }

    if (existingAccount && backendAccount && !existingAccount.walletId) {
      existingAccount.walletId = backendAccount.id;
    }

    if (existingAccount) {
      updatedAccounts.push({ ...existingAccount, extra: accountExtra });
    } else {
      updatedAccounts.push(smartWalletAccount);
    }

    dispatch({
      type: UPDATE_ACCOUNTS,
      payload: updatedAccounts,
    });
    await dispatch(saveDbAction('accounts', { accounts: updatedAccounts }, true));
  };
};

export const removeAccountAction = (accountAddress: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();

    const updatedAccounts = accounts.filter(account => account.id.toLowerCase() !== accountAddress.toLowerCase());
    if (accounts.length === updatedAccounts.length) {
      return;
    }
    dispatch({
      type: UPDATE_ACCOUNTS,
      payload: updatedAccounts,
    });
    await dispatch(saveDbAction('accounts', { accounts: updatedAccounts }, true));
  };
};

export const setActiveAccountAction = (accountId: string) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();

    const account = accounts.find(acc => acc.id === accountId);
    if (!account) {
      reportErrorLog('setActiveAccountAction failed: no account', { accounts, accountId });
      return;
    }

    const updatedAccounts = accounts.map(acc => ({ ...acc, isActive: acc.id === accountId }));

    dispatch({
      type: UPDATE_ACCOUNTS,
      payload: updatedAccounts,
    });

    dispatch(saveDbAction('accounts', { accounts: updatedAccounts }, true));
  };
};

export const switchAccountAction = (accountId: string) => {
  return (dispatch: Dispatch) => {
    dispatch({ type: CHANGING_ACCOUNT, payload: true });

    dispatch(setActiveAccountAction(accountId));
    dispatch(setActiveBlockchainNetworkAction(BLOCKCHAIN_NETWORK_TYPES.ETHEREUM));
    dispatch(fetchAssetsBalancesAction());
    dispatch(fetchCollectiblesAction());
    dispatch(fetchTransactionsHistoryAction());
    dispatch(checkForMissedAssetsAction());

    dispatch({ type: CHANGING_ACCOUNT, payload: false });
  };
};

// TODO: deprecate due Etherspot
export const initOnLoginSmartWalletAccountAction = (privateKey: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      appSettings: { data: { blockchainNetwork } },
      accounts: { data: accounts },
      user: { data: user },
    } = getState();

    const smartWalletAccount = findFirstLegacySmartAccount(accounts);
    if (!smartWalletAccount) return;

    const smartWalletAccountId = getAccountId(smartWalletAccount);
    await dispatch(initSmartWalletSdkAction(privateKey));

    const activeAccountType = getActiveAccountType(accounts);
    const setAccountActive = activeAccountType !== ACCOUNT_TYPES.LEGACY_SMART_WALLET; // set to active routine
    await dispatch(connectSmartWalletAccountAction(smartWalletAccountId, setAccountActive));
    dispatch(fetchVirtualAccountBalanceAction());

    if (setAccountActive && blockchainNetwork) {
      const shouldChangeNetwork = !isSupportedBlockchain(blockchainNetwork);
      dispatch({
        type: SET_ACTIVE_NETWORK,
        payload: shouldChangeNetwork ? BLOCKCHAIN_NETWORK_TYPES.ETHEREUM : blockchainNetwork,
      });
    }

    // following code should not be done if user is not registered on back-end
    if (!user?.walletId) return;

    dispatch(checkUserENSNameAction());
    dispatch(checkIfSmartWalletWasRegisteredAction(privateKey, smartWalletAccountId));
  };
};

export const fallbackToSmartAccountAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const activeAccount = activeAccountSelector(getState());
    const { accounts: { data: accounts } } = getState();
    if (activeAccount && !isSupportedAccountType(activeAccount.type)) {
      const switchToAccount = accounts.find(({ type }) => type === ACCOUNT_TYPES.LEGACY_SMART_WALLET)
     || accounts.find(({ type }) => type === ACCOUNT_TYPES.KEY_BASED);
      if (switchToAccount) dispatch(switchAccountAction(switchToAccount.id));
    }
  };
};
