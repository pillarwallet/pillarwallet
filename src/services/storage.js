// @flow
import PouchDB from 'pouchdb-react-native';
import merge from 'lodash.merge';
import { Sentry } from 'react-native-sentry';

function Storage(name: string, opts: ?Object) {
  this.name = name;
  this.opts = opts;
  this.db = new PouchDB(name, opts);
}

Storage.prototype.get = function (id: string) {
  return this.db.get(id).catch(() => ({}));
};

Storage.prototype.getConflicts = function (): Promise<String[]> {
  return this.getAllDocs()
    .then(({ rows }) => (
      rows.map(({ doc }) => doc._conflicts).reduce((memo, item) => memo.concat(item), [])
    ));
};

/**
 * V1 db repairment by dropping the whole db and re-populating it with the old data.
 */
Storage.prototype.repair = async function () {
  const docs = await this.getAllDocs().then(({ rows }) => rows.map(({ doc }) => doc));
  await this.db.destroy();
  this.db = new PouchDB(this.name, this.opts);
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

Storage.prototype.save = function (id: string, data: Object, forceRewrite: boolean = false) {
  return this.db.get(id).then((doc) => {
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
    return this.db.put(record, options);
  })
    .catch(async (err) => {
      if (err.status !== 404) {
        const db = await this.db.allDocs();
        Sentry.captureException({
          id,
          data,
          err,
          method: 'PUT',
          db: JSON.stringify(db),
        });
      }
      return this.db.post({ _id: id, ...data });
    })
    .catch((err) => {
      Sentry.captureException({
        id,
        data,
        err,
        method: 'POST',
      });
    });
};

Storage.prototype.getAllDocs = function () {
  return this.db.allDocs({ conflicts: true });
};

Storage.prototype.removeAll = function () {
  return this.db.allDocs().then(result => {
    return Promise.all(result.rows.map(row => {
      return this.db.remove(row.id, row.value.rev);
    }));
  });
};

Storage.getInstance = function (name: string, opts: ?Object) {
  if (!this._instances) {
    this._instances = {};
  }
  this._instances[name] = this._instances[name] || new Storage(name, opts);
  return this._instances[name];
};

export default Storage;
