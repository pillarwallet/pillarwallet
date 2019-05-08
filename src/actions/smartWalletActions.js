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
import {
  SET_SMART_WALLET_SDK_INIT,
  SET_SMART_WALLET_ACCOUNTS,
  SET_SMART_WALLET_CONNECTED_ACCOUNT,
  ADD_SMART_WALLET_UPGRADE_ASSETS,
  ADD_SMART_WALLET_UPGRADE_COLLECTIBLES,
  DISMISS_SMART_WALLET_UPGRADE,
  SET_SMART_WALLET_ASSETS_TRANSFER_TRANSACTIONS,
  SET_SMART_WALLET_UPGRADE_STATUS,
} from 'constants/smartWalletConstants';
import SmartWalletService from 'services/smartWallet';
import {
  addNewAccountAction,
  setActiveAccountAction,
} from 'actions/accountsActions';
import { saveDbAction } from 'actions/dbActions';
import type { AssetTransfer } from 'models/Asset';
import type { Collectible } from 'models/Collectible';
import type { SmartWalletTransferTransaction } from 'models/Transaction';

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
    if (!smartWalletService) return Promise.reject();
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
      async account => dispatch(addNewAccountAction(account.address, account)),
    );
    return Promise.all(newAccountsPromises);
  };
};

export const connectSmartWalletAccountAction = (accountId: string) => {
  return async (dispatch: Function) => {
    if (!smartWalletService) return;
    const connectedAccount = await smartWalletService.connectAccount(accountId);
    dispatch({
      type: SET_SMART_WALLET_CONNECTED_ACCOUNT,
      payload: connectedAccount,
    });
    await dispatch(setActiveAccountAction(accountId));
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
    dispatch(loadSmartWalletAccountsAction());
    const account = await smartWalletService.fetchConnectedAccount();
    dispatch({
      type: SET_SMART_WALLET_CONNECTED_ACCOUNT,
      account,
    });
  };
};

export const upgradeToSmartWalletAction = () => {
  return async (dispatch: Function, getState: Function) => {
    const {
      smartWallet: {
        sdkInitialized,
      },
    } = getState();
    if (!sdkInitialized) {
      // TODO: sdk not initialized error
      console.log('sdk not initialized');
      return;
    }
    await dispatch(loadSmartWalletAccountsAction());
    const {
      smartWallet: {
        accounts,
      },
    } = getState();
    if (!accounts.length) {
      // TODO: sdk accounts failed error
      console.log('no sdk accounts');
      return;
    }
    await dispatch(connectSmartWalletAccountAction(accounts[0].address));
    await dispatch(setActiveAccountAction(accounts[0].address));
    // TODO: make transactions to smart wallet account address before deploy
    //  as balance check will fail during deploy if balance is 0
    // dispatch(deploySmartWalletAction());
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

export const setAssetsTransferTransactions = (transactions: SmartWalletTransferTransaction[]) => {
  return async (dispatch: Function) => {
    dispatch(saveDbAction('smartWallet', { upgradeTransferTransactions: transactions }));
    dispatch({
      type: SET_SMART_WALLET_ASSETS_TRANSFER_TRANSACTIONS,
      payload: transactions,
    });
  };
};

export const setSmartWalletUpgradeStatus = (upgradeStatus: string) => {
  return async (dispatch: Function) => {
    dispatch(saveDbAction('smartWallet', { upgradeStatus }));
    dispatch({
      type: SET_SMART_WALLET_UPGRADE_STATUS,
      payload: upgradeStatus,
    });
  };
};
