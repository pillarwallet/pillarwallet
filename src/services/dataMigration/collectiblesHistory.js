// @flow
import get from 'lodash.get';


export default function (storageData: Object) {
  const { collectiblesHistory = {} } = get(storageData, 'collectiblesHistory', {});

  return collectiblesHistory;
}
