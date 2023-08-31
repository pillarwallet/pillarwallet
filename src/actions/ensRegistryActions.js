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

// actions
import { reserveEtherspotEnsNameAction } from 'actions/etherspotActions';

// constants
import { ADD_ENS_REGISTRY_RECORD, SET_ENS_REGISTRY_RECORDS } from 'constants/ensRegistryConstants';

// models, types
import type { Dispatch, GetState } from 'reducers/rootReducer';

// utils
import {
  getEnsName,
  lookupAddress,
  logBreadcrumb,
  resolveEnsName,
} from 'utils/common';
import { findFirstArchanovaAccount, getAccountEnsName } from 'utils/accounts';

// selectors
import { accountsSelector } from 'selectors';

// actions
import { saveDbAction } from './dbActions';


export const setEnsNameIfNeededAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const user = getState().user.data;
    const { username } = user;

    if (!username) {
      logBreadcrumb('setEnsNameIfNeededAction', 'checkUserENSNameAction failed: no username', { user });
      return;
    }

    const fullEnsName = getEnsName(username);
    const resolvedAddress = await resolveEnsName(fullEnsName);

    // if address is resolved then it's either already taken or reserved
    if (resolvedAddress) return;

    const accounts = accountsSelector(getState());
    const legacySmartWallet = findFirstArchanovaAccount(accounts);

    // reserve Etherspot ENS only for new accounts that does not have ENS on Archanova account
    const archanovaEnsName = getAccountEnsName(legacySmartWallet);
    if (archanovaEnsName) return;

    dispatch(reserveEtherspotEnsNameAction(username));
  };
};

export const addEnsRegistryRecordAction = (address: string, ensName: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { ensRegistry: { data: ensRegistry } } = getState();
    if (ensRegistry[address]) return;

    dispatch(saveDbAction('ensRegistry', { ensRegistry: { [address]: ensName } }));
    dispatch({
      type: ADD_ENS_REGISTRY_RECORD,
      payload: {
        address,
        ensName,
      },
    });
  };
};

export const lookupAddressAction = (address: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { ensRegistry: { data: ensRegistry } } = getState();
    if (ensRegistry[address]) return;

    const ensName = await lookupAddress(address);
    if (ensName) {
      dispatch(addEnsRegistryRecordAction(address, ensName));
    }
  };
};

export const extractEnsInfoFromTransactionsAction = (transactions: Object[]) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const  ensRegistry = getState().ensRegistry?.data;
    let dataUpdated = false;

    transactions.forEach(transaction => {
      const sender = transaction.from || transaction.sender;
      const recipient = transaction.to || transaction.recipient;

      const fromEnsName = get(sender, 'account.ensName');
      const fromAddress = get(sender, 'account.address');
      const toEnsName = get(recipient, 'account.ensName');
      const toAddress = get(recipient, 'account.address');

      if (fromEnsName && !ensRegistry[fromAddress]) {
        ensRegistry[fromAddress] = fromEnsName;
        dataUpdated = true;
      }

      if (toEnsName && !ensRegistry[toAddress]) {
        ensRegistry[toAddress] = toEnsName;
        dataUpdated = true;
      }
    });

    if (dataUpdated) {
      dispatch({
        type: SET_ENS_REGISTRY_RECORDS,
        payload: ensRegistry,
      });

      dispatch(saveDbAction('ensRegistry', { ensRegistry }));
    }
  };
};
