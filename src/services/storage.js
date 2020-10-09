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
import get from 'lodash.get';
import merge from 'lodash.merge';
import * as Sentry from '@sentry/react-native';
import { printLog, reportLog } from 'utils/common';
import PouchDBStorage from './pouchDBStorage';
import { firebaseAuth, firebaseDb } from './firebase';

const { Error, Warning } = Sentry.Severity;

const STORAGE_SETTINGS_KEY = 'storageSettings';

const getDb = (uid: string) => firebaseDb.ref(`/users/${uid}`); // eslint-disable-line i18next/no-literal-string

function Storage(name: string) {
  this.name = name;
  this.activeDocs = {};
  this.db = getDb(firebaseAuth?.currentUser?.uid);
}

Storage.prototype.get = async function (id: string) {
  const data = await this.db.once('value')
    .then(snapshot => {
      const dbState = snapshot.val();
      // TODO is this safe?
      return dbState ? dbState[id] : {};
    })
    .catch(e => {
      reportLog('Failed to fetch value from Database', e, Warning);
    });
  return data || {};
};

Storage.prototype.mergeValue = async function (id: string, data: Object): Object {
  const currentValue = await this.get(id);
  return merge({}, currentValue, data);
};

Storage.prototype.save = async function (id: string, data: Object, forceRewrite: boolean = false) {
  const newValue = forceRewrite ? data : await this.mergeValue(id, data);

  if (this.activeDocs[id]) {
    reportLog('Race condition spotted', { id, data, forceRewrite }, Error);
  }

  this.activeDocs[id] = true;

  return this.db.update({ [id]: newValue })
    .then(() => { this.activeDocs[id] = false; })
    .catch(e => {
      reportLog('Failed to update user storage database', e, Warning);
      this.activeDocs[id] = false;
    });
};

Storage.prototype.getAll = function () {
  return this.db.once('value')
    .then(snapshot => snapshot.val())
    .catch(e => {
      reportLog('Failed to load data from database', e, Warning);
    });
};

Storage.prototype.removeAll = async function () {
  try {
    await this.db.remove();
  } catch (e) {
    reportLog('Failed to remove user data from database', e, Error);
  }
};

Storage.prototype.migrateFromPouchDB = async function (storageData: Object) {
  const { storageSettings = {} } = get(storageData, STORAGE_SETTINGS_KEY, {});
  if (storageSettings.pouchDBMigrated) return Promise.resolve();

  try {
    printLog('Migrating data');
    const pouchDBStorage = PouchDBStorage.getInstance('db');
    const pouchDocs = await pouchDBStorage.getAllDocs()
      .then(({ rows }) => rows.map(({ doc }) => doc));

    await Promise.all(pouchDocs.map((doc) => {
      const {
        _id,
        _conflicts,
        _rev,
        ...rest
      } = doc;
      return this.save(_id, { ...rest });
    }));

    await this.save(STORAGE_SETTINGS_KEY, {
      storageSettings: {
        ...storageSettings,
        pouchDBMigrated: true,
      },
    }, true);
  } catch (e) {
    reportLog('PouchB migration failed', { error: e }, Error);
  }
  return Promise.resolve();
};

Storage.prototype.set = async function (data: Object) {
  try {
    await this.db.set(data);
  } catch (e) {
    reportLog('Failed to migrate user storage to firebase', e, Error);
  }
};

Storage.getInstance = function (name: string) {
  if (!this._instances) {
    this._instances = {};
  }
  this._instances[name] = this._instances[name] || new Storage(name);
  return this._instances[name];
};

Storage.prototype.initialize = async function () {
  const timeout = setTimeout(() => {
    // failed to fetch data, likely because user is offline
    reportLog('Failed to initialize user Firebase storage', null, Warning);
    // TODO handle
  }, 5000);
  try {
    const dbState = await this.getAll();
    if (!dbState) {
      const userUID = firebaseAuth?.currentUser?.uid;
      this.db = getDb(userUID);
      // TODO - rather migrate user straight away
      await this.set({ });
    }
    clearTimeout(timeout);
  } catch (e) {
    clearTimeout(timeout);
    reportLog('Failed to initialize user Firebase storage', e, Warning);
  }
};

export default Storage;
