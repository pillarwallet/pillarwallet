// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
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
