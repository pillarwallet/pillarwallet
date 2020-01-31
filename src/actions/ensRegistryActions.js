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

// constants
import { ADD_ENS_REGISTRY_RECORD, SET_ENS_REGISTRY_RECORDS } from 'constants/ensRegistryConstants';

// models, types
import type { Dispatch, GetState } from 'reducers/rootReducer';

// utils
import { lookupAddress } from 'utils/common';

// actions
import { saveDbAction } from './dbActions';


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
    const { ensRegistry: { data: ensRegistry } } = getState();
    let dataUpdated = false;

    transactions.forEach(transaction => {
      const fromEnsName = get(transaction, 'from.account.ensName') || get(transaction, 'sender.account.ensName');
      const fromAddress = get(transaction, 'from.account.address') || get(transaction, 'sender.account.address');
      const toEnsName = get(transaction, 'to.account.ensName') || get(transaction, 'recipient.account.ensName');
      const toAddress = get(transaction, 'to.account.address') || get(transaction, 'recipient.account.address');

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
