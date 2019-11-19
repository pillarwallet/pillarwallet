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
import { utils } from 'ethers';
import { generateHDKeyPair, generateKeyPairPool } from '../keyPairGenerator';

const { HDNode } = utils;

const MOCK_MNEMONIC = 'spoon what cliff giraffe suffer ski option light bounce hunt senior choose';
const MOCK_PRIVKEY = '0x0123456789012345678901234567890123456789012345678901234567890123';

describe('keyPairGenerator utils tests', () => {
  it('Should successfully output the HDNode publicKey twice with same seed and derivePath', async () => {
    const hdnode1 = await HDNode.fromSeed(MOCK_PRIVKEY).derivePath('m/1/1\'/0\'/0/0');
    const hdnode2 = await HDNode.fromSeed(MOCK_PRIVKEY).derivePath('m/1/1\'/0\'/0/0');
    expect(hdnode1.publicKey).toBe(hdnode2.publicKey);
  });

  it('Should successfully generate two HDNode keys from the given mnemonic and derivePath', async () => {
    const hdnodebase = await HDNode.fromMnemonic(MOCK_MNEMONIC);
    const keyPair = generateHDKeyPair(
      hdnodebase,
      'm/44/60\'/0\'/connType/0', 0);
    expect(keyPair).toBeTruthy();
    expect(keyPair.A).toBeTruthy();
    expect(keyPair.Ad).toBeTruthy();
    expect(keyPair.connIndex).toEqual(0);
    expect(keyPair.A).not.toBe(keyPair.Ad);
  });

  it('Should successfully generate two HDNode keys from the given privateKey and derivePath', async () => {
    const hdnodebase = await HDNode.fromSeed(MOCK_PRIVKEY);
    const keyPair = generateHDKeyPair(
      hdnodebase,
      'm/44/60\'/0\'/connType/0', 0);
    expect(keyPair).toBeTruthy();
    expect(keyPair.A).toBeTruthy();
    expect(keyPair.Ad).toBeTruthy();
    expect(keyPair.connIndex).toEqual(0);
    expect(keyPair.A).not.toBe(keyPair.Ad);
  });

  it('Should successfully generate an array of Derived keys with a value of 5 with a mnemonic', async () => {
    const keyPairs = await generateKeyPairPool(MOCK_MNEMONIC, MOCK_PRIVKEY, -1, 0, 5);
    expect(keyPairs).toBeTruthy();
    expect(keyPairs.length).toBe(5);
  });

  it('Should successfully generate an array of Derived keys with a value of 5 without a mnemonic', async () => {
    const keyPairs = await generateKeyPairPool('', MOCK_PRIVKEY, -1, 0, 5);
    expect(keyPairs).toBeTruthy();
    expect(keyPairs.length).toBe(5);
  });
});
