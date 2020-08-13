// @flow
import get from 'lodash.get';


export default function (storageData: Object) {
  const { balances = {} } = get(storageData, 'balances', {});

  return balances;
}
