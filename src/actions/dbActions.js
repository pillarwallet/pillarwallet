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
import EncryptedStorage from 'services/encryptedStorage';

import { UPDATE_DB, ENCRYPTED_UPDATE_DB } from 'constants/dbConstants';

import type { DbAction, EncryptedDbAction } from 'models/DbAction';

const storage = Storage.getInstance('db');
export const encryptedStorage = EncryptedStorage.getInstance('encryptdb');

export const saveDbAction = (key: string, data: any, forceRewrite: boolean = false): DbAction => ({
  type: UPDATE_DB,
  queue: 'db', // eslint-disable-line i18next/no-literal-string
  callback: (next: () => void) => {
    storage
      .save(key, data, forceRewrite)
      .then(() => next()) // eslint-disable-line
      .catch(() => {});
  },
});

export const saveEncryptedDbAction = (key: string, data: any, forceRewrite: boolean = false): EncryptedDbAction => ({
  type: ENCRYPTED_UPDATE_DB,
  queue: 'encryptdb', // eslint-disable-line i18next/no-literal-string
  callback: (next: () => void) => {
    encryptedStorage
      .save(key, data, forceRewrite)
      .then(() => next()) // eslint-disable-line
      .catch(() => {});
  },
});
