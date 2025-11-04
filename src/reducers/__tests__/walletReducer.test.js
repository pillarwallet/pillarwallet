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
import { SET_WALLET } from 'constants/walletConstants';

// types
import type { BackupStatus } from 'reducers/walletReducer';
import type { EthereumWallet } from 'models/Wallet';

// reducers will be required after mocking time to stabilize date in initialState
let reducer;

const mockWallet: EthereumWallet = {
  address: '0xaddr',
  privateKey: '0xprivKey',
  mnemonic: undefined,
};

const FIXED_TIME = new Date('2020-01-01T00:00:00.000Z').getTime();
const mockDate = new Date(FIXED_TIME);

const mockFailedAttempts = {
  numberOfFailedAttempts: 0,
  date: mockDate,
};

const mockBackupStatus: BackupStatus = {
  isImported: false,
  isBackedUp: false,
};

describe('Wallet reducer', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    // $FlowFixMe[prop-missing] - setSystemTime is available in Jest modern timers
    // $FlowFixMe[incompatible-call]
    jest.setSystemTime(FIXED_TIME);
    jest.isolateModules(() => {
      // $FlowFixMe[cannot-resolve-name]
      // $FlowFixMe[unclear-type]
      // eslint-disable-next-line import/no-dynamic-require, global-require
      reducer = require('reducers/walletReducer').default;
    });
  });

  afterAll(() => {
    jest.useRealTimers();
  });
  it('should handle SET_WALLET', () => {
    const updateAction = { type: SET_WALLET, payload: mockWallet };

    const expected = {
      data: mockWallet,
      backupStatus: mockBackupStatus,
      pinAttemptsCount: 0,
      lastPinAttempt: 0,
      failedAttempts: mockFailedAttempts,
      isDecrypting: false,
      isEncrypting: false,
      isChangingPin: false,
      errorMessage: null,
    };
    expect(reducer(undefined, updateAction)).toEqual(expected);
  });
});
