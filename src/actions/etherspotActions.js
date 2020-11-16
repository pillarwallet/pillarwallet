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

// services
import etherspot from 'services/etherspot';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import smartWalletService from 'services/smartWallet';
import { reportErrorLog } from 'utils/common';
import isEmpty from 'lodash.isempty';
import {
  SET_SMART_WALLET_ACCOUNTS,
  SET_SMART_WALLET_CONNECTED_ACCOUNT,
  SMART_WALLET_UPGRADE_STATUSES,
} from 'constants/smartWalletConstants';
import { saveDbAction } from 'actions/dbActions';
import {
  addAccountAction,
  setActiveAccountAction,
} from 'actions/accountsActions';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { normalizeWalletAddress } from 'utils/wallet';
import { SET_INITIAL_ASSETS } from 'constants/assetsConstants';
import { fetchAssetsBalancesAction } from 'actions/assetsActions';
import { fetchCollectiblesAction } from 'actions/collectiblesActions';
import {
  connectSmartWalletAccountAction,
  setSmartWalletConnectedAccount,
  setSmartWalletUpgradeStatusAction,
} from 'actions/smartWalletActions';
import type SDKWrapper from 'services/api';
import type { SmartWalletAccount } from 'models/SmartWalletAccount';
import { addressesEqual } from 'utils/assets';
import {
  SET_ETHERSPOT_ACCOUNTS,
} from 'constants/etherspotConstants';
import Toast from 'components/Toast';
import t from 'translations/translate';
import { sdkConstants } from '@smartwallet/sdk';
import get from 'lodash.get';
import { setConnectedDevicesAction } from 'actions/connectedDevicesActions';
import { Account as EtherspotAccount } from 'etherspot';

Z
export const initEtherspotServiceAction = (privateKey: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      session: { data: { isOnline } },
    } = getState();

    if (!isOnline) return; // nothing to do

    await etherspot.init(privateKey);
  };
};

export const setEtherspotAccountsAction = (accounts: Account[]) => {
  return async (dispatch: Dispatch) => {
    if (isEmpty(accounts)) {
      // Note: there should be always at least one account, it syncs on Etherspot SDK init, otherwise it's failure
      reportErrorLog('setEtherspotAccountsAction failed: no accounts', { accounts });
      return;
    }

    dispatch({ type: SET_ETHERSPOT_ACCOUNTS, payload: accounts });
    await dispatch(saveDbAction('etherspot', { accounts }));
  };
};

export const importEtherspotAccountsAction = (privateKey: string) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      session: { data: session },
      user: { data: user },
    } = getState();

    if (!session.isOnline) return; // offline, nothing to dp

    if (!etherspot?.sdk) {
      reportErrorLog('importEtherspotAccountsAction failed: action dispatched when Etherspot SDK was not initialized');
      return;
    }

    if (!user.username) {
      reportErrorLog('importEtherspotAccountsAction failed: no username', { user });
      return;
    }

    const etherspotAccounts = await etherspot.getAccounts();
    if (isEmpty(etherspotAccounts)) {
      // Note: there should be always at least one account, it syncs on Etherspot SDK init, otherwise it's failure
      reportErrorLog('importEtherspotAccountsAction failed: no accounts', { etherspotAccounts });
      return;
    }

    await dispatch(setEtherspotAccountsAction(etherspotAccounts));

    if (!user?.walletId) {
      reportErrorLog('importEtherspotAccountsAction failed: no walletId', { user });
      return;
    }

    const { walletId } = user;

    const backendAccounts = await api.listAccounts(walletId);
    if (!backendAccounts) {
      reportErrorLog('importEtherspotAccountsAction failed: no backendAccounts', { walletId });
      return;
    }

    // sync accounts with Pillar backend
    await Promise.all(etherspotAccounts.map((account) => {
      const accountExists = backendAccounts.some(({ ethAddress }) => addressesEqual(ethAddress, account.address));
      if (!accountExists) {
        return api.registerSmartWallet({
          walletId,
          privateKey,
          ethAddress: account.address,
          fcmToken: session.fcmToken,
        }).catch((error) => {
          reportErrorLog('importEtherspotAccountsAction api.registerSmartWallet failed', { error });
          return Promise.resolve();
        });
      }
      return Promise.resolve();
    }));

    // sync accounts with app
    await Promise.all(etherspotAccounts.map((etherspotAccount) => dispatch(addAccountAction(
      etherspotAccount.address,
      ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET,
      etherspotAccount, // full object as extras
      backendAccounts,
    ))));

    // set active
    const accountId = normalizeWalletAddress(etherspotAccounts[0].address);
    dispatch(setActiveAccountAction(accountId));

    // set default assets for active Etherspot wallet
    const initialAssets = await api.fetchInitialAssets(walletId);
    await dispatch({
      type: SET_INITIAL_ASSETS,
      payload: { accountId, assets: initialAssets },
    });

    const assets = { [accountId]: initialAssets };
    dispatch(saveDbAction('assets', { assets }, true));
    dispatch(fetchAssetsBalancesAction());
    dispatch(fetchCollectiblesAction());
  };
};
