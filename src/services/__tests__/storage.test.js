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
import Storage from 'services/storage';

const storage = Storage.getInstance('db-test.db');
const docID = 'encryptedWallet';
const mockEncryptedWallet: Object = { address: 'encr_ypted' };

describe('Storage service', () => {
  it('should create/update a doc with data in PouchDB service', async () => {
    const { ok } = await storage.save(docID, mockEncryptedWallet);
    expect(ok).toBeTruthy();
  });

  it('should retrieve a doc from PouchDB service', async () => {
    const { address } = await storage.get(docID);
    expect(address).toBe(mockEncryptedWallet.address);
  });

  it('should clear the storage', async () => {
    await storage.removeAll();
    const wallet = await storage.get(docID);
    expect(wallet).toEqual({});
  });
});
