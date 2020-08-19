// @flow
import get from 'lodash.get';


export default function (storageData: Object) {
  const { assets = {} } = get(storageData, 'assets', {});

  return assets;
}
