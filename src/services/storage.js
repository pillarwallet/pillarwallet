// @flow
import PouchDB from 'pouchdb-react-native';
import merge from 'lodash.merge';

function Storage(name: string, opts: ?Object) {
  this.db = new PouchDB(name, opts);
}

Storage.prototype.get = function (id: string) {
  return this.db.get(id).catch(() => ({}));
};

Storage.prototype.save = function (id: string, data: Object) {
  return this.db.get(id).then((doc) => {
    const record = merge(
      {},
      doc,
      {
        _id: id,
        _rev: doc._rev,
      },
      data,
    );
    return this.db.put(record);
  }).catch(() => this.db.post({ _id: id, ...data }));
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
