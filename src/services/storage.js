// @flow
import PouchDB from 'pouchdb-react-native';

function Storage(name: string, opts: ?Object) {
  this.db = new PouchDB(name, opts);
}

Storage.prototype.get = function (id: string) {
  return this.db.get(id);
};

Storage.prototype.save = function (id: string, data: Object) {
  return this.db.get(id).then((doc) => {
    return this.db.put({
      _id: id,
      _rev: doc._rev,
      ...data,
    });
  }).catch(() => this.db.post({ _id: id, ...data }));
};

Storage.getInstance = function (name: string, opts: ?Object) {
  if (!this._instances) {
    this._instances = {};
  }
  this._instances[name] = this._instances[name] || new Storage(name, opts);
  return this._instances[name];
};

export default Storage;
