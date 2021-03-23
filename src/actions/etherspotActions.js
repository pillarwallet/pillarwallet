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
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { SET_INITIAL_ASSETS } from 'constants/assetsConstants';

// actions
import { addAccountAction, setActiveAccountAction } from 'actions/accountsActions';
import { saveDbAction } from 'actions/dbActions';
import { setEnsNameIfNeededAction } from 'actions/ensRegistryActions';

// services
import etherspot from 'services/etherspot';

// utils
import { normalizeWalletAddress } from 'utils/wallet';
import { reportErrorLog } from 'utils/common';
import { findFirstEtherspotAccount } from 'utils/accounts';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type SDKWrapper from 'services/api';


export const initEtherspotServiceAction = (privateKey: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      session: { data: { isOnline } },
    } = getState();

    if (!isOnline) return; // nothing to do

    await etherspot.init(privateKey);
  };
};

export const importEtherspotAccountsAction = () => {
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

    if (!user) {
      reportErrorLog('importEtherspotAccountsAction failed: no user');
      return;
    }

    const { walletId } = user;

    if (!walletId) {
      reportErrorLog('importEtherspotAccountsAction failed: no walletId', { user });
      return;
    }

    const etherspotAccounts = await etherspot.getAccounts();
    if (!etherspotAccounts) {
      // Note: there should be always at least one account, it syncs on Etherspot SDK init, otherwise it's failure
      reportErrorLog('importEtherspotAccountsAction failed: no accounts', { etherspotAccounts });
      return;
    }

    // sync accounts with app
    await Promise.all(etherspotAccounts.map((etherspotAccount) => dispatch(addAccountAction(
      etherspotAccount.address,
      ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET,
      etherspotAccount, // full object as extras
    ))));

    const accountId = normalizeWalletAddress(etherspotAccounts[0].address);

    // set active
    dispatch(setActiveAccountAction(accountId));

    // set ENS if needed
    dispatch(setEnsNameIfNeededAction());

    // set default assets for active Etherspot wallet
    const initialAssets = await api.fetchInitialAssets(walletId);
    await dispatch({
      type: SET_INITIAL_ASSETS,
      payload: { accountId, assets: initialAssets },
    });

    const assets = { [accountId]: initialAssets };

    dispatch(saveDbAction('assets', { assets }, true));
  };
};

export const reserveEtherspotEnsNameAction = (username: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      session: { data: { isOnline } },
    } = getState();

    if (!isOnline) return; // nothing to do

    const etherspotAccount = findFirstEtherspotAccount(accounts);
    if (!etherspotAccount) {
      reportErrorLog('reserveEtherspotENSNameAction failed: no Etherspot account found');
      return;
    }

    const reserved = await etherspot.reserveEnsName(username);
    if (!reserved) {
      reportErrorLog('reserveEtherspotENSNameAction reserveENSName failed', { username });
    }
  };
};
