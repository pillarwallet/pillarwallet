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
import { sdkConstants } from '@smartwallet/sdk';
import { isEqual } from 'lodash';

// constants
import {
  UPDATE_ACCOUNTS,
  ACCOUNT_TYPES,
  CHANGING_ACCOUNT,
  DEPLOY_ACCOUNTS,
  DEPLOY_ACCOUNTS_FETCHING,
} from 'constants/accountsConstants';
import { ARCHANOVA_WALLET_UPGRADE_STATUSES } from 'constants/archanovaConstants';
import { PIN_CODE } from 'constants/navigationConstants';
import { BLOCKCHAIN_NETWORK_TYPES, SET_ACTIVE_NETWORK } from 'constants/blockchainNetworkConstants';
import { CHAIN } from 'constants/chainConstants';

// actions
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchCollectiblesAction } from 'actions/collectiblesActions';
import { saveDbAction } from 'actions/dbActions';
import { fetchTransactionsHistoryAction } from 'actions/historyActions';
import {
  connectArchanovaAccountAction,
  initArchanovaSdkAction,
  setSmartWalletUpgradeStatusAction,
  fetchVirtualAccountBalanceAction,
} from 'actions/smartWalletActions';
import { setActiveBlockchainNetworkAction } from 'actions/blockchainNetworkActions';
import { connectEtherspotAccountAction } from 'actions/etherspotActions';
import { updateWalletConnectSessionsByActiveAccount } from 'actions/walletConnectSessionsActions';

// utils
import {
  findAccountById,
  findFirstArchanovaAccount,
  getAccountId,
  getActiveAccountType,
  isArchanovaAccount,
  getActiveAccount,
  isEtherspotAccount,
  findFirstEtherspotAccount,
} from 'utils/accounts';
import { isSupportedBlockchain } from 'utils/blockchainNetworks';
import { logBreadcrumb, isCaseInsensitiveMatch } from 'utils/common';
import { patchArchanovaAccountExtra } from 'utils/archanova';

// services
import { navigate } from 'services/navigation';
import etherspotServices from 'services/etherspot';

// selectors
import { accountsSelector } from 'selectors';

// types
import type { AccountTypes } from 'models/Account';
import type { Dispatch, GetState } from 'reducers/rootReducer';

export const addAccountAction = (accountAddress: string, type: AccountTypes, accountExtra?: any) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
    } = getState();

    const patchedAccountExtra =
      type === ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET ? patchArchanovaAccountExtra(accountExtra, accounts) : accountExtra;

    const newAccount = {
      id: accountAddress,
      type,
      extra: patchedAccountExtra,
      isActive: false,
    };

    const existingAccount = accounts.find((account) => isCaseInsensitiveMatch(account.id, accountAddress));
    const updatedAccounts = accounts.filter((account) => !isCaseInsensitiveMatch(account.id, accountAddress));

    if (existingAccount) {
      // $FlowFixMe: flow gets confused here
      updatedAccounts.push({ ...existingAccount, extra: patchedAccountExtra });
    } else {
      // $FlowFixMe: flow gets confused here
      updatedAccounts.push(newAccount);
    }

    dispatch({
      type: UPDATE_ACCOUNTS,
      payload: updatedAccounts,
    });

    await dispatch(saveDbAction('accounts', { accounts: updatedAccounts }, true));
  };
};

export const updateAccountExtraIfNeededAction = (accountId: string, accountExtra: any) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const accounts = accountsSelector(getState());
    const accountToUpdate = findAccountById(accountId, accounts);
    if (!accountToUpdate) return;

    const patchedAccountExtra = isArchanovaAccount(accountToUpdate)
      ? patchArchanovaAccountExtra(accountExtra, accounts)
      : accountExtra;

    const accountExtraNeedsUpdate = !isEqual(accountToUpdate?.extra, patchedAccountExtra);
    if (!accountExtraNeedsUpdate) return;

    const updatedAccounts = accounts.reduce((updated, account) => {
      if (getAccountId(account) === accountId) {
        return [...updated, { ...account, extra: patchedAccountExtra }];
      }

      return [...updated, account];
    }, []);

    dispatch({ type: UPDATE_ACCOUNTS, payload: updatedAccounts });
    await dispatch(saveDbAction('accounts', { accounts: updatedAccounts }, true));
  };
};

export const removeAccountAction = (accountAddress: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
    } = getState();

    const updatedAccounts = accounts.filter((account) => account.id.toLowerCase() !== accountAddress.toLowerCase());
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
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      smartWallet: {
        connectedAccount = {},
        upgrade,
      },
    } = getState();

    const account = accounts.find((acc) => acc.id === accountId);
    if (!account) return;

    const updatedAccounts = accounts.map((acc) => ({ ...acc, isActive: acc.id === accountId }));
    dispatch({
      type: UPDATE_ACCOUNTS,
      payload: updatedAccounts,
    });
    dispatch(saveDbAction('accounts', { accounts: updatedAccounts }, true));

    if (account.type !== ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET || !account.extra) return;

    const { state = '' } = connectedAccount;
    if (state === sdkConstants.AccountStates.Deployed) {
      dispatch(setSmartWalletUpgradeStatusAction(ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE));
      return;
    }
    if (
      [ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYING, ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE].includes(
        upgrade?.status,
      )
    ) {
      return;
    }
    dispatch(setSmartWalletUpgradeStatusAction(ARCHANOVA_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED));
  };
};

export const switchAccountAction = (accountId: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      smartWallet: { sdkInitialized },
    } = getState();

    const activeAccount = accounts.find((account) => getAccountId(account) === accountId);

    dispatch({ type: CHANGING_ACCOUNT, payload: true });

    if (activeAccount?.type === ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET) {
      if (!sdkInitialized) {
        navigate(PIN_CODE, { initSmartWalletSdk: true, switchToAcc: accountId });
        return;
      }

      await dispatch(connectArchanovaAccountAction(accountId));
    } else if (activeAccount?.type === ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET) {
      dispatch(connectEtherspotAccountAction(accountId));
    }

    dispatch(setActiveAccountAction(accountId));
    dispatch(setActiveBlockchainNetworkAction(BLOCKCHAIN_NETWORK_TYPES.ETHEREUM));
    dispatch(fetchAssetsBalancesAction());
    dispatch(fetchCollectiblesAction());
    dispatch(fetchTransactionsHistoryAction());
    dispatch(updateWalletConnectSessionsByActiveAccount());
    dispatch({ type: CHANGING_ACCOUNT, payload: false });
  };
};

export const initOnLoginArchanovaAccountAction = (privateKey: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      appSettings: {
        data: { blockchainNetwork },
      },
      accounts: { data: accounts },
    } = getState();

    const smartWalletAccount = findFirstArchanovaAccount(accounts);
    if (!smartWalletAccount) return;

    const smartWalletAccountId = getAccountId(smartWalletAccount);
    await dispatch(initArchanovaSdkAction(privateKey, true));

    const activeAccountType = getActiveAccountType(accounts);
    const setAccountActive = activeAccountType !== ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET; // set to active routine
    await dispatch(connectArchanovaAccountAction(smartWalletAccountId));
    dispatch(fetchVirtualAccountBalanceAction());

    if (setAccountActive && blockchainNetwork) {
      const shouldChangeNetwork = !isSupportedBlockchain(blockchainNetwork);
      dispatch({
        type: SET_ACTIVE_NETWORK,
        payload: shouldChangeNetwork ? BLOCKCHAIN_NETWORK_TYPES.ETHEREUM : blockchainNetwork,
      });
    }
  };
};

/**
 * Switch active account to archanova.
 */
export const switchToArchanovaAccountIfNeededAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const accounts = accountsSelector(getState());

    const activeAccount = getActiveAccount(accounts);
    if (isArchanovaAccount(activeAccount)) return;

    const archanovaAccount = findFirstArchanovaAccount(accounts);
    if (!archanovaAccount) {
      logBreadcrumb('switchToArchanovaAccountIfNeededAction', 'no archanova account found', { accounts });
      return;
    }

    dispatch(switchAccountAction(getAccountId(archanovaAccount)));
  };
};

/**
 * Switch active account to Etherspot.
 */
export const switchToEtherspotAccountIfNeededAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const accounts = accountsSelector(getState());

    const activeAccount = getActiveAccount(accounts);
    if (isEtherspotAccount(activeAccount)) return;

    const etherspotAccount = findFirstEtherspotAccount(accounts);
    if (!etherspotAccount) {
      logBreadcrumb('switchToEtherspotAccountIfNeededAction', 'no Etherspot account found', { accounts });
      return;
    }

    dispatch(switchAccountAction(getAccountId(etherspotAccount)));
  };
};

/**
 * Free Deploy Polygon / Gnosis accounts.
 */
export const deployAccounts = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      deployAccounts: { isFetching },
    } = getState();

    const networkChains = [CHAIN.XDAI];

    if (isFetching) return;

    dispatch({ type: DEPLOY_ACCOUNTS_FETCHING, payload: true });

    const networkPromises = networkChains.map((chain) => etherspotServices.setBatchDeployAccount(chain));
    const statusReponses = await Promise.all(networkPromises);

    const finalResponse = networkChains.map((chain, index) => {
      return {
        chain,
        status: statusReponses[index],
      };
    });

    dispatch({ type: DEPLOY_ACCOUNTS, payload: finalResponse });

    dispatch({ type: DEPLOY_ACCOUNTS_FETCHING, payload: false });
  };
};
