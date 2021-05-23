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
import { orderBy } from 'lodash';
import { getEnv } from 'configs/envConfig';

// constants
import { COLLECTIBLES, ETH, PLR, TOKENS, SNX, USD, defaultFiatCurrency } from 'constants/assetsConstants';

// utils
import { formatFiat, formatAmount, isCaseInsensitiveMatch, reportOrWarn } from 'utils/common';

// types
import type {
  Asset,
  AssetData,
  Assets,
  AssetOption,
  AssetOptionBalance,
  Rates,
} from 'models/Asset';
import type { GasToken } from 'models/Transaction';
import type { Collectible } from 'models/Collectible';
import type { Value } from 'utils/common';
import type {
  AssetBalance,
  AssetsBalances,
} from 'models/Balances';


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

export const transformBalancesToObject = (balancesArray: AssetBalance[] = []): AssetsBalances => {
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

export const getBalanceBN = (balances: ?AssetsBalances, asset: ?string): BigNumber => {
  if (!balances || !asset) return BigNumber('0');
  return BigNumber(balances[asset]?.balance ?? '0');
};

/**
 * @deprecated: do not use because of rounding issues
 */
export const getBalance = (balances: ?AssetsBalances, asset: string): number => {
  if (!balances) return 0;

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
  txFeeInWei: ?Value,
  gasToken: ?GasToken = {},
): string => {
  if (!txFeeInWei) txFeeInWei = new BigNumber(0);
  if (!balance) balance = 0;

  if (typeof balance !== 'string') {
    balance = balance.toString();
  }

  const feeSymbol = get(gasToken, 'symbol', ETH);

  if (token !== feeSymbol) {
    return balance;
  }

  // we need to convert txFeeInWei to EthersBigNumber as ethers.js utils use different library for Big Numbers
  const decimals = get(gasToken, 'decimals', 'ether');
  const maxAmount = utils.parseUnits(balance, decimals).sub(EthersBigNumber.from(txFeeInWei.toString()));
  if (maxAmount.lt(0)) return '0';

  return utils.formatUnits(maxAmount, decimals).toString();
};

export const isEnoughBalanceForTransactionFee = (
  balances: AssetsBalances,
  transaction: {
    txFeeInWei: ?Value,
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

  const txFeeInWeiBN = new BigNumber(txFeeInWei?.toString() ?? 0); // compatibility

  return balanceInWei.gte(txFeeInWeiBN);
};

export const balanceInEth = (balances: AssetsBalances, rates: Rates): number => {
  const balanceValues: AssetBalance[] = (Object.values(balances): any);

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

export const getTotalBalanceInFiat = (balances: AssetsBalances, rates: Rates, currency: string): number => {
  const ethRates = rates[ETH];
  if (!ethRates) {
    return 0;
  }

  return get(ethRates, currency, 0) * balanceInEth(balances, rates);
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

/** Checks if address list contains given address. Similar to `Array.includes`.  */
export const addressesInclude = (addresses: string[], addressToFind: ?string): boolean => {
  return addresses.some(item => isCaseInsensitiveMatch(item, addressToFind));
};

export const findSupportedAsset = (supportedAssets: Asset[], addressToFind: ?string): Asset | void => {
  return supportedAssets.find(asset => addressesEqual(asset.address, addressToFind));
};

export const isSupportedAssetAddress = (supportedAssets: Asset[], addressToCheck: ?string): boolean => {
  return supportedAssets.some((asset: Asset) => addressesEqual(asset.address, addressToCheck));
};

export const isSupportedAssetSymbol = (supportedAssets: Asset[], symbolToCheck: ?string): boolean => {
  return supportedAssets.some((asset: Asset) => asset.symbol === symbolToCheck);
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
  return userAssets.find(({ address }: Asset) => addressesEqual(address, assetAddress))
  || supportedAssetsData.find(({ address }: Asset) => addressesEqual(address, assetAddress))
  || {};
};

export const getAssetFromRegistry = (assetRegistry: Asset[], symbol: string): ?Asset => {
  return assetRegistry.find((asset) => asset.symbol === symbol);
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

const isSynthetixAsset = (asset: Asset): boolean => !!asset.isSynthetixAsset && asset.symbol !== SNX;

export const isSynthetixTx = (fromAsset: Asset, toAsset: Asset): boolean =>
  isSynthetixAsset(fromAsset) && isSynthetixAsset(toAsset);

export const getBalanceInFiat = (
  baseFiatCurrency: ?string,
  assetBalance: ?Value,
  rates: Rates,
  symbol: string,
): number => {
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const assetBalanceInFiat = assetBalance ?
    parseFloat(assetBalance.toString()) * getRate(rates, symbol, fiatCurrency) : 0;
  return assetBalanceInFiat;
};

export const getFormattedBalanceInFiat = (
  baseFiatCurrency: ?string,
  assetBalance: ?Value,
  rates: Rates,
  symbol: string,
): string => {
  const assetBalanceInFiat = getBalanceInFiat(baseFiatCurrency, assetBalance, rates, symbol);
  if (!assetBalanceInFiat) return '';
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  return assetBalanceInFiat ? formatFiat(assetBalanceInFiat, fiatCurrency) : '';
};

const getAssetOptionBalance = (
  symbol: string,
  balances: ?AssetsBalances,
  rates: ?Rates,
  fiatCurrency: ?string,
): ?AssetOptionBalance => {
  if (!balances) return null;

  const balance = getBalance(balances, symbol);
  const balanceInFiat = rates ? getBalanceInFiat(fiatCurrency, balance, rates, symbol) : undefined;
  const value = rates ? getFormattedBalanceInFiat(fiatCurrency, balance, rates, symbol) : undefined;

  return {
    token: symbol,
    balance,
    balanceInFiat,
    value,
  };
};

export const getAssetOption = (
  asset: Asset,
  balances: ?AssetsBalances,
  rates: ?Rates,
  baseFiatCurrency: ?string,
): AssetOption => {
  const { symbol, iconUrl } = asset;

  const assetBalance = getBalance(balances, symbol);
  const formattedAssetBalance = assetBalance ? formatAmount(assetBalance) : '';
  const formattedBalanceInFiat = rates ? getFormattedBalanceInFiat(baseFiatCurrency, assetBalance, rates, symbol) : '';

  return {
    ...asset,
    imageUrl: iconUrl ? `${getEnv().SDK_PROVIDER}/${iconUrl}?size=3` : '',
    formattedBalanceInFiat,
    icon: iconUrl,
    assetBalance: formattedAssetBalance,
    balance: getAssetOptionBalance(symbol, balances, rates, baseFiatCurrency),
  };
};

export const mapAssetDataToAssetOption = (
  assetData: AssetData,
  balances?: ?AssetsBalances,
  rates?: ?Rates,
  fiatCurrency?: ?string,
): AssetOption => {
  return {
    symbol: assetData.token,
    address: assetData.contractAddress,
    decimals: assetData.decimals,
    name: assetData.name ?? '',
    imageUrl: assetData.icon,
    tokenType: assetData.tokenType ?? TOKENS,
    balance: getAssetOptionBalance(assetData.token, balances, rates, fiatCurrency),
  };
};

export const convertUSDToFiat = (value: number, rates: Rates = {}, fiatCurrency: string) => {
  const ethRates = rates[ETH];
  if (!ethRates) {
    return 0;
  }
  return value * (ethRates[fiatCurrency] / ethRates[USD]);
};

/**
 * Sort asset options with default priority
 */
export const defaultSortAssetOptions = (options: AssetOption[]): AssetOption[] => {
  return orderBy(
    options,
    [
      (option: AssetOption) => getAssetOptionSortPriority(option),
      (option: AssetOption) => option.balance?.balanceInFiat ?? 0,
      (option: AssetOption) => option.name?.trim().toLowerCase(),
    ],
    ['desc', 'desc', 'asc'],
  );
};

export const getAssetOptionSortPriority = ({ symbol, balance, imageUrl }: AssetOption) => {
  if (balance?.balance && symbol === ETH) return 4;
  if (balance?.balance && symbol === PLR) return 3;
  if (balance?.balance) return 2;
  if (imageUrl) return 1;
  return 0;
};
