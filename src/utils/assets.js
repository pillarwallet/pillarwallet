// @flow
import type { Balances } from 'models/Asset';

export function transformAssetsToObject(assetsArray: Object[] = []): Object {
  return assetsArray.reduce((memo, asset) => {
    memo[asset.symbol] = asset;
    return memo;
  }, {});
}

export function getBalance(balances: Balances = {}, asset: string = ''): number {
  return balances[asset] ? Number(balances[asset].balance) : 0;
}
