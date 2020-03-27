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

import { getPrivateKeyFromKeychainData, shouldUpdateKeychainObject } from 'utils/keychain';

describe('keychain utils test', () => {
  it('Should return null for invalid data provided', () => {
    expect(getPrivateKeyFromKeychainData({})).toBeNull();
    expect(getPrivateKeyFromKeychainData(undefined)).toBeNull();
    expect(getPrivateKeyFromKeychainData({ testKey: 'testValue' })).toBeNull();
  });

  it('Should return privateKey for valid data provided', () => {
    expect(getPrivateKeyFromKeychainData({ privateKey: 'testKey' })).toEqual('testKey');
  });

  it('Should return true if keychain object update is necessary', () => {
    expect(shouldUpdateKeychainObject({})).toEqual(true);
    expect(shouldUpdateKeychainObject({ testKey: 'testValue' })).toEqual(true);
    expect(shouldUpdateKeychainObject({ privateKey: 'testValue' })).toEqual(true);
    expect(shouldUpdateKeychainObject({ mnemonic: 'testValue' })).toEqual(true);
    expect(shouldUpdateKeychainObject({ privateKey: '', mnemonic: '' })).toEqual(true);
  });

  it('Should return false if keychain object update is not necessary', () => {
    expect(shouldUpdateKeychainObject({ privateKey: 'testValue', mnemonic: 'testValue' })).toEqual(false);
  });
});
