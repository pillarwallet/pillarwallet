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
import { generateKeyPairThreadPool } from 'utils/keyPairGenerator';
import { UPDATE_CONNECTION_KEY_PAIRS } from 'constants/connectionKeyPairsConstants';
import { saveDbAction } from './dbActions';

export const updateConnectionKeyPairs = (mnemonic: string, privateKey: string, walletId: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { connectionKeyPairs: { data: connectionKeyPairs, lastConnectionKeyIndex } } = getState();
    const numberOfConnections = await api.connectionsCount(walletId);
    const newKeyPairs =
      await generateKeyPairThreadPool(
        mnemonic,
        privateKey,
        numberOfConnections.count,
        connectionKeyPairs.length,
        lastConnectionKeyIndex);
    const resultConnectionKeys = connectionKeyPairs.concat(newKeyPairs);
    dispatch({
      type: UPDATE_CONNECTION_KEY_PAIRS,
      payload: resultConnectionKeys,
    });
    dispatch(saveDbAction('connectionKeyPairs', { connectionKeyPairs: resultConnectionKeys }, true));
  };
};

export const useConnectionKeyPairs = (count: number = 1) => {
  return async (dispatch: Function, getState: Function) => {
    const { connectionKeyPairs: { data: connectionKeyPairs } } = getState();
    const resultConnectionKeys = connectionKeyPairs.splice(0, count);
    dispatch({
      type: UPDATE_CONNECTION_KEY_PAIRS,
      payload: resultConnectionKeys,
    });
    dispatch(saveDbAction('connectionKeyPairs', { connectionKeyPairs }, true));
    return resultConnectionKeys;
  };
};
