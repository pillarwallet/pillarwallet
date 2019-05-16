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
import Toast from 'components/Toast';
import {
  SET_SMART_WALLET_SDK_INIT,
  SET_SMART_WALLET_ACCOUNTS,
  SET_SMART_WALLET_CONNECTED_ACCOUNT,
  ADD_SMART_WALLET_UPGRADE_ASSETS,
  ADD_SMART_WALLET_UPGRADE_COLLECTIBLES,
  DISMISS_SMART_WALLET_UPGRADE,
  SET_SMART_WALLET_ASSETS_TRANSFER_TRANSACTIONS,
  SET_SMART_WALLET_UPGRADE_STATUS,
  SMART_WALLET_UPGRADE_STATUSES,
} from 'constants/smartWalletConstants';
import { ACCOUNT_TYPES, UPDATE_ACCOUNTS } from 'constants/accountsConstants';
import { UPDATE_BALANCES } from 'constants/assetsConstants';
import { SET_HISTORY } from 'constants/historyConstants';
import SmartWalletService from 'services/smartWallet';
import {
  addNewAccountAction,
  setActiveAccountAction,
  switchAccountAction,
} from 'actions/accountsActions';
import { saveDbAction } from 'actions/dbActions';
import {
  signAssetTransactionAction,
  sendSignedAssetTransactionAction,
} from 'actions/assetsActions';
import type { AssetTransfer } from 'models/Asset';
import type { Collectible } from 'models/Collectible';

let smartWalletService: SmartWalletService;
export const initSmartWalletSdkAction = (walletPrivateKey: string) => {
  return async (dispatch: Function) => {
    smartWalletService = new SmartWalletService();
    await smartWalletService.init(walletPrivateKey);
    dispatch({
      type: SET_SMART_WALLET_SDK_INIT,
      payload: true,
    });
  };
};

export const loadSmartWalletAccountsAction = () => {
  return async (dispatch: Function) => {
    if (!smartWalletService) return;
    const accounts = await smartWalletService.getAccounts();
    if (!accounts.length) {
      const newAccount = await smartWalletService.createAccount();
      if (newAccount) accounts.push(newAccount);
    }
    dispatch({
      type: SET_SMART_WALLET_ACCOUNTS,
      payload: accounts,
    });
    const newAccountsPromises = accounts.map(
      async account => dispatch(addNewAccountAction(account.address, ACCOUNT_TYPES.SMART_WALLET, account)),
    );
    await Promise.all(newAccountsPromises);
  };
};

export const setSmartWalletUpgradeStatusAction = (upgradeStatus: string) => {
  return async (dispatch: Function) => {
    // TODO: subscribe for smart wallet account deployment complete check and fire this action
    dispatch(saveDbAction('smartWallet', { upgradeStatus }));
    dispatch({
      type: SET_SMART_WALLET_UPGRADE_STATUS,
      payload: upgradeStatus,
    });
  };
};

export const connectSmartWalletAccountAction = (accountId: string) => {
  return async (dispatch: Function, getState: Function) => {
    if (!smartWalletService) return;
    const connectedAccount = await smartWalletService.connectAccount(accountId).catch(() => null);
    if (!connectedAccount) {
      Toast.show({
        message: 'Failed to connect to Smart Wallet account',
        type: 'warning',
        title: 'Unable to upgrade',
        autoClose: false,
      });
      return;
    }
    dispatch({
      type: SET_SMART_WALLET_CONNECTED_ACCOUNT,
      payload: connectedAccount,
    });
    dispatch(setActiveAccountAction(accountId));

    // update account state
    const newState = get(connectedAccount, 'state', '');
    const currentUpgradeStatus = get(getState(), 'smartWallet.upgrade.status', '');
    if (newState === 'Deployed' && currentUpgradeStatus === SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED) {
      dispatch(setSmartWalletUpgradeStatusAction(SMART_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE));
    }
  };
};

export const deploySmartWalletAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const {
      smartWallet: {
        connectedAccount: {
          address: accountAddress,
          state: accountState,
        },
      },
    } = getState();
    dispatch(setActiveAccountAction(accountAddress));
    if (accountState.toLowerCase() === 'deployed') {
      console.log('deploySmartWalletAction account is already deployed!');
      return;
    }
    const deployTxHash = await smartWalletService.deploy();
    console.log('deploySmartWalletAction deployTxHash: ', deployTxHash);
    // update accounts info
    dispatch(setSmartWalletUpgradeStatusAction(
      SMART_WALLET_UPGRADE_STATUSES.DEPLOYING,
    ));
    dispatch(loadSmartWalletAccountsAction());
    const account = await smartWalletService.fetchConnectedAccount();
    dispatch({
      type: SET_SMART_WALLET_CONNECTED_ACCOUNT,
      account,
    });
    dispatch(setSmartWalletUpgradeStatusAction(
      SMART_WALLET_UPGRADE_STATUSES.TRANSFERRING_ASSETS,
    ));
  };
};

export const addAssetsToSmartWalletUpgradeAction = (assets: AssetTransfer[]) => ({
  type: ADD_SMART_WALLET_UPGRADE_ASSETS,
  payload: assets,
});

export const addCollectiblesToSmartWalletUpgradeAction = (collectibles: Collectible[]) => ({
  type: ADD_SMART_WALLET_UPGRADE_COLLECTIBLES,
  payload: collectibles,
});

export const dismissSmartWalletUpgradeAction = () => {
  return async (dispatch: Function) => {
    dispatch(saveDbAction('app_settings', { appSettings: { smartWalletUpgradeDismissed: true } }));
    dispatch({ type: DISMISS_SMART_WALLET_UPGRADE });
  };
};

export const setAssetsTransferTransactionsAction = (transactions: Object[]) => {
  return async (dispatch: Function) => {
    dispatch(saveDbAction('smartWallet', { upgradeTransferTransactions: transactions }));
    dispatch({
      type: SET_SMART_WALLET_ASSETS_TRANSFER_TRANSACTIONS,
      payload: transactions,
    });
  };
};

export const createAssetsTransferTransactionsAction = (wallet: Object, transactions: Object[]) => {
  return async (dispatch: Function) => {
    const signedTransactions = [];
    // we need this to wait for each to complete because of local nonce increment
    for (const transaction of transactions) { // eslint-disable-line
      const signedTransaction = await dispatch(signAssetTransactionAction(transaction, wallet)); // eslint-disable-line
      signedTransactions.push({
        transaction,
        signedTransaction,
      });
    }
    // filter out if any of the signed transactions got empty object or error
    const signedTransactionsFixed = signedTransactions.filter(tx =>
      !!tx && !!tx.signedTransaction && Object.keys(tx.signedTransaction),
    );
    dispatch(setAssetsTransferTransactionsAction(signedTransactionsFixed));
  };
};

export const checkAssetTransferTransactionsAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const {
      smartWallet: {
        upgrade: {
          transfer: {
            transactions = [],
          },
        },
      },
    } = getState();
    if (!transactions.length) {
      // TODO: no transactions at all?
      return;
    }
    const pendingTransactions = transactions.filter(transaction => transaction.status === 'sent');
    if (pendingTransactions.length) return;
    const unsentTransactions = transactions.filter(transaction => transaction.status !== 'complete');
    if (!unsentTransactions.length) {
      // TODO: all complete?
      return;
    }
    // grab first in queue
    const unsentTransaction = unsentTransactions[0];
    const { signedTransaction: { signed: unsentTransactionSigned } } = unsentTransaction;
    const signedTransactionHash = await dispatch(sendSignedAssetTransactionAction(unsentTransactionSigned));
    if (!signedTransactionHash || signedTransactionHash.error) {
      // TODO: transaction failed
      return;
    }
    const updatedTransactions = transactions.filter(
      transaction => transaction.signedTransaction.signed !== unsentTransactionSigned,
    );
    updatedTransactions.push({
      ...unsentTransaction,
      status: 'sent',
      transactionHash: signedTransactionHash,
    });
    dispatch(setAssetsTransferTransactionsAction(updatedTransactions));
  };
};

export const upgradeToSmartWalletAction = (wallet: Object, transferTransactions: Object[]) => {
  return async (dispatch: Function, getState: Function) => {
    const {
      smartWallet: {
        sdkInitialized,
      },
    } = getState();
    if (!sdkInitialized) {
      Toast.show({
        message: 'Failed to load Smart Wallet SDK',
        type: 'warning',
        title: 'Unable to upgrade',
        autoClose: false,
      });
      return Promise.reject();
    }
    await dispatch(loadSmartWalletAccountsAction());
    const {
      smartWallet: {
        accounts,
      },
    } = getState();
    if (!accounts.length) {
      Toast.show({
        message: 'Failed to load Smart Wallet account',
        type: 'warning',
        title: 'Unable to upgrade',
        autoClose: false,
      });
      return Promise.reject();
    }
    const { address } = accounts[0];
    const addressedTransferTransactions = transferTransactions.map(transaction => {
      return { ...transaction, to: address };
    });
    await dispatch(createAssetsTransferTransactionsAction(
      wallet,
      addressedTransferTransactions,
    ));
    dispatch(setSmartWalletUpgradeStatusAction(
      SMART_WALLET_UPGRADE_STATUSES.TRANSFERRING_ASSETS,
    ));
    await dispatch(connectSmartWalletAccountAction(address));
    dispatch(checkAssetTransferTransactionsAction());

    // TODO: deploy only if assets transfer step is complete
    // await dispatch(deploySmartWalletAction());

    return Promise.resolve(true);
  };
};

export const cleanSmartWalletAccountsAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const {
      accounts: { data: accounts },
      balances: { data: balances },
      history: { data: history },
    } = getState();

    const activeAccount = accounts.find(({ isActive }) => isActive);
    const keyBasedAccount = accounts.find(({ type }) => type === ACCOUNT_TYPES.KEY_BASED);
    const smartAccounts = accounts.filter(({ type }) => type === ACCOUNT_TYPES.SMART_WALLET);

    if (!smartAccounts.length) {
      console.log('smartAccounts are empty');
      return;
    }

    dispatch({
      type: UPDATE_ACCOUNTS,
      payload: [keyBasedAccount],
    });
    dispatch(saveDbAction('accounts', { accounts: [keyBasedAccount] }, true));

    const updatedBalances = { [keyBasedAccount.id]: balances[keyBasedAccount.id] };
    dispatch(saveDbAction('balances', { balances: updatedBalances }, true));
    dispatch({
      type: UPDATE_BALANCES,
      payload: updatedBalances,
    });

    const updatedHistory = { [keyBasedAccount.id]: history[keyBasedAccount.id] };
    dispatch(saveDbAction('history', { history: updatedHistory }, true));
    dispatch({
      type: SET_HISTORY,
      payload: updatedHistory,
    });

    if (activeAccount.type === ACCOUNT_TYPES.SMART_WALLET) {
      dispatch(switchAccountAction(keyBasedAccount.id));
    }
  };
};
