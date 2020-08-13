// @flow
import get from 'lodash.get';


export default function (storageData: Object) {
  const { collectibles = {} } = get(storageData, 'collectibles', {});

  return collectibles;
}
