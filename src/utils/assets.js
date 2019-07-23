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
import { NETWORK_PROVIDER } from 'react-native-dotenv';
import get from 'lodash.get';
import type { Asset, Balances, Rates } from 'models/Asset';
import { ETH } from 'constants/assetsConstants';

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
  const tokenRates = rates[token];
  const ethRate = rates[ETH];

  if (!tokenRates) {
    return 0;
  }

  if (!ethRate) {
    return tokenRates[fiatCurrency] || 0;
  }

  const ethToFiat = ethRate[fiatCurrency];
  if (!ethToFiat) {
    return 0;
  }

  if (token === ETH) {
    return ethToFiat;
  }

  const tokenToETH = tokenRates[ETH];
  if (!tokenToETH) {
    return tokenRates[fiatCurrency] || 0;
  }

  return ethToFiat * tokenToETH;
}

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

export function getPMTToken(): Asset {
  let tokenAddress;
  switch (NETWORK_PROVIDER) {
    case 'ropsten':
      tokenAddress = '0xF383e4C078b34Da69534A7B7F1F381d418315273';
      break;
    default:
      tokenAddress = '';
  }
  return {
    isPreferred: false,
    socialMedia: [],
    icos: [],
    address: tokenAddress,
    decimals: 0,
    description: 'Pillar Meta Token',
    email: 'info@pillarproject.io',
    iconMonoUrl: 'asset/images/tokens/icons/plr.png',
    iconUrl: 'asset/images/tokens/icons/plrColor.png',
    isDefault: true,
    name: 'Pillar Meta Token',
    symbol: 'PMT',
    telegram: 'https://t.me/pillarofficial',
    twitter: 'https://twitter.com/PillarWallet',
    wallpaperUrl: 'asset/images/tokens/wallpaper/plrBg.png',
    website: 'https://pillarproject.io/',
    whitepaper: 'https://pillarproject.io/documents/Pillar-Gray-Paper.pdf',
    id: '5d25a47b36425c001165ff6111111',
    updatedAt: '2019-07-22T12:43:23.541Z',
    patternUrl: 'asset/images/patternIcons/plr.png',
  };
}

export function getPPNTokenAddress(token: string, assets: Asset[]) {
  const asset = assets.find(({ symbol }) => symbol === token);
  return get(asset, 'address', '');
}
