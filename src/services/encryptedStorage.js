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
// eslint-disable-next-line import/no-extraneous-dependencies
import RNEncryptedStorage from 'react-native-encrypted-storage';
import merge from 'lodash.merge';
import { reportErrorLog, logBreadcrumb } from 'utils/common';

function EncryptedStorage(name: string) {
  this.name = name;
  this.prefix = `encrypted-wallet-storage:${this.name}:`; // eslint-disable-line i18next/no-literal-string
  this.activeDocs = {};
}

EncryptedStorage.prototype.getKey = function (id: string) {
  return this.prefix + id;
};

EncryptedStorage.prototype.get = async function (id: string) {
  try {
    const data = await RNEncryptedStorage.getItem(this.getKey(id));
    if (!data) return {};

    return JSON.parse(data);
  } catch (error) {
    reportErrorLog('EncryptedStorage getItem failed', { error, id });
    return {};
  }
};

EncryptedStorage.prototype.mergeValue = async function (id: string, data: Object): Object {
  const currentValue = await this.get(id);
  return merge({}, currentValue, data);
};

EncryptedStorage.prototype.save = async function (id: string, data: Object, forceRewrite: boolean = false) {
  const newValue = forceRewrite ? data : await this.mergeValue(id, data);
  const key = this.getKey(id);

  if (this.activeDocs[key]) {
    logBreadcrumb('EncryptedStorage', 'Race condition spotted', { id, data, forceRewrite });
  }

  this.activeDocs[key] = true;

  await RNEncryptedStorage.setItem(key, JSON.stringify(newValue))
    .then(() => {
      this.activeDocs[key] = false;
    })
    .catch((err) => {
      reportErrorLog('EncryptedStorage Exception', { id, data, err });
      this.activeDocs[key] = false;
    });
  return null;
};

EncryptedStorage.prototype.removeAll = async function () {
  try {
    await RNEncryptedStorage.clear();
  } catch (error) {
    reportErrorLog('EncryptedStorage clear failed!', { error });
  }
};

EncryptedStorage.getInstance = function (name: string) {
  if (!this._instances) {
    this._instances = {};
  }
  this._instances[name] = this._instances[name] || new EncryptedStorage(name);
  return this._instances[name];
};

export default EncryptedStorage;
