// @flow
import Storage from 'services/storage';
import { UPDATE_DB } from 'constants/dbConstants';

const storage = Storage.getInstance('db');

export const saveDbAction = (key: string, data: any, forceRewrite: boolean = false) => {
  return {
    queue: 'db',
    type: UPDATE_DB,
    callback: (next: Function) => {
      storage.save(key, data, forceRewrite).then(() => {
        next(); // eslint-disable-line
      }).catch(() => {});
    },
  };
};
