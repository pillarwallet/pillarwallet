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
import AsyncStorage from '@react-native-community/async-storage';
import merge from 'lodash.merge';
import { Sentry } from 'react-native-sentry';

function Storage(name: string) {
  this.name = name;
  this.prefix = `wallet-storage:${this.name}:`;
}

Storage.prototype.getKey = function (id: string) {
  return this.prefix + id;
};

Storage.prototype.get = function (id: string) {
  return AsyncStorage.getItem(this.getKey(id))
    .then(JSON.parse)
    .catch(() => ({}));
};

const activeDocs = {};
Storage.prototype.save = async function (id: string, data: Object, forceRewrite: boolean = false) {
  const currentValue = await this.get(id);
  const key = this.getKey(id);

  if (activeDocs[key]) {
    Sentry.captureMessage('Race condition spotted', {
      extra: {
        id,
        data,
        forceRewrite,
      },
    });
  }

  activeDocs[key] = true;

  const newValue = forceRewrite ? data : merge({}, currentValue, data);
  return AsyncStorage
    .setItem(key, JSON.stringify(newValue))
    .then(() => {
      activeDocs[key] = false;
    })
    .catch((err) => {
      Sentry.captureException({
        id,
        data,
        err,
      });
      activeDocs[key] = false;
    });
};

Storage.prototype.getAllKeys = function () {
  return AsyncStorage
    .getAllKeys()
    .then(keys => keys.filter(key => key.startsWith(this.prefix)))
    .catch(() => []);
};

Storage.prototype.removeAll = async function () {
  const keys = await this.getAllKeys();
  return AsyncStorage.multiRemove(keys);
};

Storage.getInstance = function (name: string) {
  if (!this._instances) {
    this._instances = {};
  }
  this._instances[name] = this._instances[name] || new Storage(name);
  return this._instances[name];
};

export default Storage;
