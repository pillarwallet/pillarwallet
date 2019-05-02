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
  GENERATE_ENCRYPTED_WALLET,
  UPDATE_WALLET_STATE,
  DECRYPT_WALLET,
  CREATED,
  DECRYPTED,
  GENERATING,
} from 'constants/walletConstants';
import reducer from '../walletReducer';

const mockWallet: Object = {
  address: '0x',
  privateKey: '',
};
const mockOnboarding: Object = {
  confirmedPin: '',
  importedWallet: null,
  apiUser: { },
  mnemonic: {
    original: '',
    shuffled: '',
    wordsToValidate: [],
  },
  pin: '',
};

const mockBackupStatus: Object = {
  isImported: false,
  isBackedUp: false,
};

describe('Wallet reducer', () => {
  it('should handle GENERATE_ENCRYPTED_WALLET', () => {
    const updateAction = { type: GENERATE_ENCRYPTED_WALLET, payload: mockWallet };
    const expected = {
      data: mockWallet,
      error: null,
      onboarding: mockOnboarding,
      walletState: CREATED,
      backupStatus: mockBackupStatus,
    };
    expect(reducer(undefined, updateAction)).toEqual(expected);
  });

  it('should handle UPDATE_WALLET_STATE', () => {
    const updateAction = { type: UPDATE_WALLET_STATE, payload: GENERATING };
    expect(reducer(undefined, updateAction)).toMatchObject({ walletState: GENERATING });
  });

  it('should handle DECRYPT_WALLET', () => {
    const updateAction = { type: DECRYPT_WALLET, payload: mockWallet };
    const expected = {
      data: mockWallet,
      error: null,
      onboarding: mockOnboarding,
      walletState: DECRYPTED,
      backupStatus: mockBackupStatus,
    };
    expect(reducer(undefined, updateAction)).toEqual(expected);
  });
});
