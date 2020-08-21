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
import { isFiatCurrency } from 'utils/exchange';
import {
  getBestAmountToBuy, validateInput, shouldTriggerSearch, getAssetBalanceFromFiat,
} from 'screens/Exchange/utils';

const assetEth = { value: 'ETH', assetBalance: '42.42', name: 'Ethereum' };
const assetPlr = { value: 'PLR', assetBalance: '0.001', name: 'Pillar' };

describe('Exchange Utility function tests', () => {
  it('Should call isFiatCurrency for EUR, GBP and USD to return true, for other symbols returns false.', () => {
    expect(isFiatCurrency('EUR')).toBeTruthy();
    expect(isFiatCurrency('GBP')).toBeTruthy();
    expect(isFiatCurrency('USD')).toBeTruthy();
    expect(isFiatCurrency('ETH')).toBeFalsy();
    expect(isFiatCurrency('')).toBeFalsy();
  });
  it('Should validate exchange input field correctly', () => {
    expect(validateInput('42.42', assetEth, assetPlr, '')).toBeTruthy();
    expect(validateInput('0', assetEth, assetPlr, '')).toBeFalsy();
    expect(validateInput('10.', assetEth, assetPlr, '')).toBeFalsy();
    expect(validateInput('test', assetEth, assetPlr, '')).toBeFalsy();
    expect(validateInput('10', null, assetPlr, '')).toBeFalsy();
    expect(validateInput('10', assetEth, assetPlr, 'error')).toBeFalsy();
  });
  it('Should trigger search under certain conditions', () => {
    expect(shouldTriggerSearch(assetEth, assetPlr, 10)).toBeTruthy();
    expect(shouldTriggerSearch(assetEth, assetEth, 10)).toBeFalsy();
    expect(shouldTriggerSearch(assetPlr, assetEth, 10)).toBeFalsy();
  });
  it('Should get asset balance from fiat amount', () => {
    const rates = { PLR: { USD: 10.0, GBP: 20.0 } };
    expect(getAssetBalanceFromFiat('USD', '10', rates, 'PLR')).toBe(1);
    expect(getAssetBalanceFromFiat('USD', '1000', rates, 'PLR')).toBe(100);
    // defaults to GBP
    expect(getAssetBalanceFromFiat(null, '20', rates, 'PLR')).toBe(1);
    expect(getAssetBalanceFromFiat('USD', 0, rates, 'PLR')).toBe(0);
    expect(getAssetBalanceFromFiat('USD', 0, rates, 'error')).toBe(0);
    expect(getAssetBalanceFromFiat('USD', 'error', rates, 'PLR')).toBe(0);
  });
});
