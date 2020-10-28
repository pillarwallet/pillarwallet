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
import { utils, BigNumber as EthersBigNumber } from 'ethers';
import { BigNumber } from 'bignumber.js';
import { ZERO_ADDRESS } from '@netgum/utils';
import get from 'lodash.get';
import { getEnv } from 'configs/envConfig';

// constants
import { COLLECTIBLES, ETH, TOKENS, USD } from 'constants/assetsConstants';

// utils
import { formatFiat, formatAmount, isCaseInsensitiveMatch, reportOrWarn } from 'utils/common';

// types
import type {
  Asset,
  AssetData,
  Assets,
  Balance,
  Balances,
  Rates,
} from 'models/Asset';
import type { GasToken } from 'models/Transaction';
import type { Collectible } from 'models/Collectible';


const sortAssetsFn = (a: Asset, b: Asset): number => {
  return a.symbol.localeCompare(b.symbol);
};

export const sortAssetsArray = (assets: Asset[]): Asset[] => {
  return assets.sort(sortAssetsFn);
};

export const transformAssetsToObject = (assetsArray: Asset[] = []): Assets => {
  return assetsArray.reduce((memo, asset) => {
    memo[asset.symbol] = asset;
    return memo;
  }, {});
};

export const transformBalancesToObject = (balancesArray: Balance[] = []): Balances => {
  return balancesArray.reduce((memo, balance) => {
    memo[balance.symbol] = balance;
    return memo;
  }, {});
};

export const getAssetsAsList = (assetsObject: Assets): Asset[] => {
  return Object.keys(assetsObject).map(id => assetsObject[id]);
};

export const sortAssets = (assets: Assets): Asset[] => {
  const assetsList = getAssetsAsList(assets);

  return sortAssetsArray(assetsList);
};

export const getBalance = (balances: Balances = {}, asset: string): number => {
  const assetBalance = get(balances, asset);
  if (!assetBalance) {
    return 0;
  }

  const number = new BigNumber(assetBalance.balance);

  return +formatAmount(number.toString());
};

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
  if (token === ETH) {
    return baseRate(rates, token, fiatCurrency);
  }

  return tokenRate(rates, token, fiatCurrency);
};

export const getFormattedRate = (
  rates: Rates,
  amount: number,
  token: string,
  fiatCurrency: string,
): string => {
  const amountInFiat = amount * getRate(rates, token, fiatCurrency);

  return formatFiat(amountInFiat, fiatCurrency);
};

export const calculateMaxAmount = (
  token: string,
  balance: number | string,
  txFeeInWei: BigNumber,
  gasToken: ?GasToken = {},
): number => {
  if (!txFeeInWei) txFeeInWei = new BigNumber(0);
  if (!balance) balance = 0;

  if (typeof balance !== 'string') {
    balance = balance.toString();
  }

  const feeSymbol = get(gasToken, 'symbol', ETH);

  if (token !== feeSymbol) {
    return +balance;
  }

  // we need to convert txFeeInWei to BigNumber as ethers.js utils use different library for Big Numbers
  const decimals = get(gasToken, 'decimals', 'ether');
  const maxAmount = utils.parseUnits(balance, decimals).sub(EthersBigNumber.from(txFeeInWei.toString()));
  if (maxAmount.lt(0)) return 0;

  return new BigNumber(utils.formatUnits(maxAmount, decimals)).toNumber();
};

export const isEnoughBalanceForTransactionFee = (
  balances: Balances,
  transaction: {
    txFeeInWei: number,
    gasToken?: ?GasToken,
    amount?: any,
    decimals?: number,
    symbol?: string,
  },
): boolean => {
  const {
    txFeeInWei,
    gasToken,
    decimals: transactionDecimals,
    amount: transactionAmount,
    symbol: transactionSymbol,
  } = transaction;

  const feeSymbol = get(gasToken, 'symbol', ETH);
  const feeDecimals = get(gasToken, 'decimals', 'ether');

  if (!balances[feeSymbol]) return false;

  const balance = getBalance(balances, feeSymbol);

  // we need to convert balanceInWei to BigNumber as ethers.js utils use different library for Big Numbers
  let balanceInWei = new BigNumber(utils.parseUnits(balance.toString(), feeDecimals));

  // subtract from balance if transaction asset matches fee asset, not suitable for collectibles
  if (transactionAmount && feeSymbol === transactionSymbol) {
    try {
      const amountInWei = new BigNumber(utils.parseUnits(transactionAmount.toString(), transactionDecimals));
      balanceInWei = balanceInWei.minus(amountInWei);
    } catch (e) {
      reportOrWarn('Error parsing asset balance', e, 'error');
    }
  }

  const txFeeInWeiBN = new BigNumber(txFeeInWei.toString()); // compatibility

  return balanceInWei.gte(txFeeInWeiBN);
};

export const balanceInEth = (balances: Balances, rates: Rates): number => {
  const balanceValues: Balance[] = Object.keys(balances).map(key => balances[key]);

  return balanceValues.reduce((total, item) => {
    const balance = +item.balance;
    const assetRates = rates[item.symbol];

    if (!assetRates || balance === 0) {
      return total;
    }

    const ethRate = assetRates[ETH] || 0;

    return total + (ethRate * balance);
  }, 0);
};

export const calculateBalanceInFiat = (
  rates: Rates,
  balances: Balances,
  currency: string,
) => {
  const ethRates = rates[ETH];
  if (!ethRates) {
    return 0;
  }

  const totalEth = balanceInEth(balances, rates);

  return get(ethRates, currency, 0) * totalEth;
};

export const getPPNTokenAddress = (token: string, assets: Assets): ?string => {
  if (token === ETH) return null;

  return get(assets[token], 'address', '');
};

export const addressesEqual = (address1: ?string, address2: ?string): boolean => {
  if (address1 === address2) return true;
  if (!address1 || !address2) return false;

  return isCaseInsensitiveMatch(address1, address2);
};

export const getAssetData = (
  userAssets: Asset[],
  supportedAssetsData: Asset[],
  assetSymbol: string,
): Asset | Object => {
  return userAssets.find(({ symbol }: Asset) => symbol === assetSymbol)
  || supportedAssetsData.find(({ symbol }: Asset) => symbol === assetSymbol)
  || {};
};

export const getAssetDataByAddress = (
  userAssets: Asset[],
  supportedAssetsData: Asset[],
  assetAddress: string,
): Asset | Object => {
  return userAssets.find(({ address }: Asset) => isCaseInsensitiveMatch(address, assetAddress))
  || supportedAssetsData.find(({ address }: Asset) => isCaseInsensitiveMatch(address, assetAddress))
  || {};
};

export const getAssetSymbolByAddress = (assets: Asset[], supportedAssets: Asset[], address: ?string): ?string => {
  let assetSymbol = null;
  if (!address) return assetSymbol;

  // NOTE: ZERO_ADDRESS usually means it's ETH transaction
  if (address === ZERO_ADDRESS) return ETH;

  const { symbol } = getAssetDataByAddress(assets, supportedAssets, address);
  if (symbol) assetSymbol = symbol;

  return assetSymbol;
};

export const mapAssetToAssetData = ({
  symbol: token,
  address: contractAddress,
  name,
  decimals,
  iconUrl,
}: Asset): AssetData => ({
  token,
  contractAddress,
  name,
  decimals,
  tokenType: TOKENS,
  icon: iconUrl ? `${getEnv().SDK_PROVIDER}/${iconUrl}?size=3` : '',
});

export const mapCollectibleToAssetData = ({
  contractAddress,
  name,
  id,
  icon,
}: Collectible): AssetData => ({
  token: '',
  decimals: 0,
  contractAddress,
  name,
  id: id.toString(),
  icon: icon || '',
  tokenType: COLLECTIBLES,
});

export const convertUSDToFiat = (value: number, rates: Rates = {}, fiatCurrency: string) => {
  const ethRates = rates[ETH];
  if (!ethRates) {
    return 0;
  }
  return value * (ethRates[fiatCurrency] / ethRates[USD]);
};
