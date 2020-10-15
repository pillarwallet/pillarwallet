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
// DEPRECATED
// Please use this class for the data migration from pouchdb to the new storage system only

import PouchDB from 'pouchdb-react-native';
import merge from 'lodash.merge';
import { printLog, reportErrorLog, reportLog } from 'utils/common';

function PouchDBStorage(name: string, opts: ?Object = {}) {
  this.name = name;
  this.opts = { ...opts };
  this.connect();
}

PouchDBStorage.prototype.connect = function () {
  this.needToReconnect = false;
  this.connection = new PouchDB(this.name, this.opts);
  printLog(`Connected to the database ${this.name}`);
};

PouchDBStorage.prototype.db = function () {
  if (this.needToReconnect) this.connect();
  return this.connection;
};

PouchDBStorage.prototype.get = function (id: string) {
  return this.db().get(id).catch(() => ({}));
};

PouchDBStorage.prototype.getConflicts = function (): Promise<String[]> {
  return this.getAllDocs()
    .then(({ rows }) => (
      rows.map(({ doc }) => doc._conflicts).reduce((memo, item) => memo.concat(item), [])
    ));
};

/**
 * V1 db repairment by dropping the whole db and re-populating it with the old data.
 */
PouchDBStorage.prototype.repair = async function () {
  const docs = await this.getAllDocs().then(({ rows }) => rows.map(({ doc }) => doc));
  if (!docs.length) return Promise.resolve();
  await this.db().destroy();
  this.connect();
  const promises = docs.map(doc => {
    const {
      _id,
      _rev,
      _conflicts,
      ...data
    } = doc;
    return this.save(_id, data).catch(() => null);
  });
  return Promise.all(promises);
};

const activeDocs = {};
PouchDBStorage.prototype.save = function (id: string, data: Object, forceRewrite: boolean = false) {
  return this.db().get(id)
    .catch(err => {
      if (err.status !== 404) {
        throw err;
      }
      return {};
    })
    .then(doc => {
      if (activeDocs[id]) {
        reportLog('Race condition spotted', {
          id,
          data,
          forceRewrite,
        });
      }

      activeDocs[id] = true;
      const options = { force: forceRewrite };
      const record = forceRewrite
        ? { _id: id, _rev: doc._rev, ...data }
        : merge(
          {},
          doc,
          {
            _id: id,
            _rev: doc._rev,
          },
          data,
        );
      return this.db().put(record, options);
    })
    .then(doc => {
      activeDocs[id] = false;
      return doc;
    })
    .catch((err) => {
      if (err.status !== 409) {
        reportErrorLog('PouchDBStorage Exception', { id, data, err });
        throw err;
      }
      activeDocs[id] = false;
      return this.save(id, data, forceRewrite);
    });
};

PouchDBStorage.prototype.getAllDocs = function () {
  return this.db().allDocs({ conflicts: true });
};

PouchDBStorage.prototype.removeAll = function () {
  return this.db().allDocs().then(result => {
    return Promise.all(result.rows.map(row => {
      return this.db().remove(row.id, row.value.rev);
    }));
  }).then(() => this.db().compact());
};

PouchDBStorage.getInstance = function (name: string, opts: ?Object) {
  if (!this._instances) {
    this._instances = {};
  }
  this._instances[name] = this._instances[name] || new PouchDBStorage(name, opts);
  return this._instances[name];
};

PouchDBStorage.prototype.close = function () {
  printLog('Closing db connection');
  this.db().close();
  this.needToReconnect = true;
};

export default PouchDBStorage;
