// @flow
import Storage from 'services/storage';

const storage = Storage.getInstance('db');

export const saveDbAction = (key: string, data: any, forceRewrite: boolean = false) => {
  return {
    queue: 'db',
    callback: (next: Function) => {
      storage.save(key, data, forceRewrite).then(() => {
        next();
      }).catch(() => {});
    },
  };
};
