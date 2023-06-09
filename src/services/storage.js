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
import AsyncStorage from '@react-native-async-storage/async-storage';
import get from 'lodash.get';
import merge from 'lodash.merge';
import { printLog, reportErrorLog, logBreadcrumb } from 'utils/common';
import PouchDBStorage from './pouchDBStorage';

const STORAGE_SETTINGS_KEY = 'storageSettings';

function Storage(name: string) {
  this.name = name;
  this.prefix = `wallet-storage:${this.name}:`; // eslint-disable-line i18next/no-literal-string
  this.activeDocs = {};
}

Storage.prototype.getKey = function (id: string) {
  return this.prefix + id;
};

Storage.prototype.get = async function (id: string) {
  const data = await AsyncStorage.getItem(this.getKey(id))
    .then(JSON.parse)
    .catch(() => {});
  return data || {};
};

Storage.prototype.mergeValue = async function (id: string, data: Object): Object {
  const currentValue = await this.get(id);
  return merge({}, currentValue, data);
};

Storage.prototype.save = async function (id: string, data: Object, forceRewrite: boolean = false) {
  const newValue = forceRewrite ? data : await this.mergeValue(id, data);
  const key = this.getKey(id);

  if (this.activeDocs[key]) {
    logBreadcrumb('AsyncStoragee', 'Race condition spotted', { id, data, forceRewrite });
  }

  this.activeDocs[key] = true;

  return AsyncStorage.setItem(key, JSON.stringify(newValue))
    .then(() => {
      this.activeDocs[key] = false;
    })
    .catch((err) => {
      reportErrorLog('AsyncStorage Exception', { id, data, err });
      this.activeDocs[key] = false;
    });
};

Storage.prototype.getAllKeys = function () {
  return AsyncStorage.getAllKeys()
    .then((keys) => keys.filter((key) => key.startsWith(this.prefix)))
    .catch(() => []);
};

Storage.prototype.getAll = function () {
  return this.getAllKeys()
    .then((keys) => AsyncStorage.multiGet(keys)) // [ ['user', 'userValue'], ['key', 'keyValue'] ]
    .then((values) => {
      return values.reduce((memo, [_key, _value]) => {
        const key = _key.replace(this.prefix, '');
        return {
          ...memo,
          [key]: JSON.parse(_value),
        };
      }, {});
    }) // { user: 'userValue', ... }
    .catch(() => ({}));
};

Storage.prototype.removeAll = async function () {
  const keys = await this.getAllKeys().then((data) => data.filter((key) => key !== this.getKey(STORAGE_SETTINGS_KEY)));
  return AsyncStorage.multiRemove(keys);
};

Storage.prototype.migrateFromPouchDB = async function (storageData: Object) {
  const { storageSettings = {} } = get(storageData, STORAGE_SETTINGS_KEY, {});
  if (storageSettings.pouchDBMigrated) return Promise.resolve();

  try {
    printLog('Migrating data');
    const pouchDBStorage = PouchDBStorage.getInstance('db');
    const pouchDocs = await pouchDBStorage.getAllDocs().then(({ rows }) => rows.map(({ doc }) => doc));

    await Promise.all(
      pouchDocs.map((doc) => {
        const { _id, _conflicts, _rev, ...rest } = doc;
        return this.save(_id, { ...rest });
      }),
    );

    await this.save(
      STORAGE_SETTINGS_KEY,
      {
        storageSettings: {
          ...storageSettings,
          pouchDBMigrated: true,
        },
      },
      true,
    );
  } catch (e) {
    reportErrorLog('DB migration to AsyncStorage failed', { error: e });
  }
  return Promise.resolve();
};

Storage.getInstance = function (name: string) {
  if (!this._instances) {
    this._instances = {};
  }
  this._instances[name] = this._instances[name] || new Storage(name);
  return this._instances[name];
};

export default Storage;
