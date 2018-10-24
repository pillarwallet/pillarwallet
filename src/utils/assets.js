// @flow
import type { Balances, Rates } from 'models/Asset';

export function transformAssetsToObject(assetsArray: Object[] = []): Object {
  return assetsArray.reduce((memo, asset) => {
    memo[asset.symbol] = asset;
    return memo;
  }, {});
}

export function getBalance(balances: Balances = {}, asset: string = ''): number {
  return balances[asset] ? Number(balances[asset].balance) : 0;
}

export function getRate(rates: Rates = {}, token: string, fiatCurrency: string): number {
  return rates[token] && rates[token][fiatCurrency] ? Number(rates[token][fiatCurrency]) : 0;
}
