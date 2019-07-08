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
import { utils } from 'ethers';
import { BigNumber } from 'bignumber.js';
import type { Balances, Rates } from 'models/Asset';
import { ETH, BTC } from 'constants/assetsConstants';

export function transformAssetsToObject(assetsArray: Object[] = []): Object {
  return assetsArray.reduce((memo, asset) => {
    memo[asset.symbol] = asset;
    return memo;
  }, {});
}

export function getBalance(balances: Balances = {}, asset: string = ''): number {
  return balances[asset] ? Number(balances[asset].balance) : 0;
}

const baseRate = (rates: Rates, asset: string, fiatCurrency: string): number => {
  const rate = rates[asset];
  if (!rate) {
    return 0;
  }

  return rate[fiatCurrency];
};

const tokenRate = (rates: Rates, token: string, fiatCurrency: string): number => {
  const tokenRates = rates[token];

  if (!tokenRates) {
    return 0;
  }

  const ethToFiat = baseRate(rates, ETH, fiatCurrency);
  if (!ethToFiat) {
    return tokenRates[fiatCurrency] || 0;
  }

  const tokenToETH = tokenRates[ETH];
  if (!tokenToETH) {
    return tokenRates[fiatCurrency] || 0;
  }

  return ethToFiat * tokenToETH;
};

export const getRate = (rates: Rates = {}, token: string, fiatCurrency: string): number => {
  if (token === BTC || token === ETH) {
    return baseRate(rates, token, fiatCurrency);
  }

  return tokenRate(rates, token, fiatCurrency);
};

export function calculateMaxAmount(token: string, balance: number | string, txFeeInWei: BigNumber): number {
  if (typeof balance !== 'string') {
    balance = balance.toString();
  }
  if (token !== ETH) {
    return +balance;
  }
  const maxAmount = utils.parseUnits(balance, 'ether').sub(txFeeInWei);
  if (maxAmount.lt(0)) return 0;
  return new BigNumber(utils.formatEther(maxAmount)).toNumber();
}

export function checkIfEnoughForFee(balances: Balances, txFeeInWei: BigNumber): boolean {
  if (!balances[ETH]) return false;
  const ethBalance = getBalance(balances, ETH);
  const balanceInWei = utils.parseUnits(ethBalance.toString(), 'ether');
  return balanceInWei.gte(txFeeInWei);
}
