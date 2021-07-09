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
import { orderBy, get, mapValues } from 'lodash';

// constants
import { COLLECTIBLES, ETH, PLR, TOKENS, USD, defaultFiatCurrency } from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';

// utils
import { formatFiat, formatAmount, isCaseInsensitiveMatch, reportOrWarn } from 'utils/common';
import { nativeAssetPerChain } from 'utils/chains';

// types
import type {
  Asset,
  AssetData,
  AssetByAddress,
  AssetOption,
  AssetOptionBalance,
  AssetsPerChain,
} from 'models/Asset';
import type { GasToken } from 'models/Transaction';
import type { Collectible } from 'models/Collectible';
import type { Value } from 'utils/common';
import type { WalletAssetBalance, WalletAssetsBalances } from 'models/Balances';
import type { Chain } from 'models/Chain';
import type { Currency, RatesBySymbol } from 'models/Rates';


const sortAssetsFn = (a: Asset, b: Asset): number => {
  return a.symbol.localeCompare(b.symbol);
};

export const sortAssetsArray = (assets: Asset[]): Asset[] => {
  return assets.sort(sortAssetsFn);
};

export const transformAssetsToObject = (assetsArray: Asset[] = []): AssetByAddress => {
  return assetsArray.reduce((memo, asset) => {
    memo[asset.symbol] = asset;
    return memo;
  }, {});
};

export const transformBalancesToObject = (
  balancesArray: WalletAssetBalance[] = [],
): WalletAssetsBalances => balancesArray.reduce((memo, balance) => ({
  ...memo,
  [balance.address]: balance,
}), {});

export const getAssetsAsList = (assetsObject: AssetByAddress): Asset[] => {
  return Object.keys(assetsObject).map(id => assetsObject[id]);
};

export const sortAssets = (assets: AssetByAddress): Asset[] => {
  const assetsList = getAssetsAsList(assets);

  return sortAssetsArray(assetsList);
};

export const getBalanceBN = (balances: ?WalletAssetsBalances, assetAddress: ?string): BigNumber => {
  if (!balances || !assetAddress) return BigNumber('0');
  return BigNumber(balances[assetAddress]?.balance ?? '0');
};

/**
 * @deprecated: do not use because of rounding issues
 */
export const getBalance = (balances: ?WalletAssetsBalances, assetAddress: string): number => {
  if (!balances) return 0;

  const assetBalance = balances?.[assetAddress];
  if (!assetBalance) {
    return 0;
  }

  const number = new BigNumber(assetBalance.balance);

  return +formatAmount(number.toString());
};

const baseRate = (rates: RatesBySymbol, asset: string, fiatCurrency: Currency): number => {
  const rate = rates[asset];
  if (!rate || !rate[fiatCurrency]) {
    return 0;
  }

  return rate[fiatCurrency];
};

const tokenRate = (rates: RatesBySymbol, token: string, fiatCurrency: Currency): number => {
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

export const getRate = (rates: RatesBySymbol = {}, token: string, fiatCurrency: Currency): number => {
  if (token === ETH) {
    return baseRate(rates, token, fiatCurrency);
  }

  return tokenRate(rates, token, fiatCurrency);
};

export const getFormattedRate = (
  rates: RatesBySymbol,
  amount: number,
  token: string,
  fiatCurrency: Currency,
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
  balances: WalletAssetsBalances,
  transaction: {
    txFeeInWei: ?Value,
    gasToken?: ?GasToken,
    amount?: any,
    decimals?: number,
    symbol?: string,
  },
  chain: Chain,
): boolean => {
  const {
    txFeeInWei,
    gasToken,
    decimals: transactionDecimals,
    amount: transactionAmount,
    symbol: transactionSymbol,
  } = transaction;

  const gasTokenAddress = gasToken?.address || nativeAssetPerChain[chain].address;
  const feeSymbol = gasToken?.symbol || nativeAssetPerChain[chain].symbol;
  const feeDecimals = gasToken?.decimals || nativeAssetPerChain[chain].decimals;

  if (!balances[gasTokenAddress]) return false;

  const balance = getBalance(balances, gasTokenAddress);

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

export const balanceInEth = (balances: WalletAssetsBalances, rates: RatesBySymbol): number => {
  const balanceValues: WalletAssetBalance[] = (Object.values(balances): any);

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

export const getTotalBalanceInFiat = (
  balances: WalletAssetsBalances,
  rates: RatesBySymbol,
  currency: string,
): number => {
  const ethRates = rates[ETH];
  if (!ethRates) {
    return 0;
  }

  return get(ethRates, currency, 0) * balanceInEth(balances, rates);
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

export const findAllAssetsBySymbol = (assets: Asset[], symbolToFind: ?string): Asset[] => {
  return assets.filter((asset) => asset.symbol === symbolToFind) ?? [];
};

export const findFirstAssetBySymbol = (assets: Asset[], symbolToFind: ?string): ?Asset => {
  return assets.find((asset) => asset.symbol === symbolToFind);
};

export const isSupportedAssetAddress = (supportedAssets: Asset[], addressToCheck: ?string): boolean => {
  return supportedAssets.some((asset: Asset) => addressesEqual(asset.address, addressToCheck));
};

export const findAsset = (
  userAssets: Asset[],
  supportedAssetsData: Asset[],
  assetAddress: string,
): ?Asset => {
  return userAssets.find(({ address }: Asset) => addressesEqual(address, assetAddress))
  || supportedAssetsData.find(({ address }: Asset) => addressesEqual(address, assetAddress));
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
  icon: iconUrl,
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

export const getBalanceInFiat = (
  baseFiatCurrency: ?Currency,
  assetBalance: ?Value,
  rates: RatesBySymbol,
  symbol: string,
): number => {
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const assetBalanceInFiat = assetBalance ?
    parseFloat(assetBalance.toString()) * getRate(rates, symbol, fiatCurrency) : 0;
  return assetBalanceInFiat;
};

export const getFormattedBalanceInFiat = (
  baseFiatCurrency: ?Currency,
  assetBalance: ?Value,
  rates: RatesBySymbol,
  symbol: string,
): string => {
  const assetBalanceInFiat = getBalanceInFiat(baseFiatCurrency, assetBalance, rates, symbol);
  if (!assetBalanceInFiat) return '';
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  return assetBalanceInFiat ? formatFiat(assetBalanceInFiat, fiatCurrency) : '';
};

const getAssetOptionBalance = (
  symbol: string,
  address: string,
  balances: ?WalletAssetsBalances,
  rates: ?RatesBySymbol,
  fiatCurrency: ?Currency,
): ?AssetOptionBalance => {
  if (!balances) return null;

  const balance = getBalance(balances, address);
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
  balances: ?WalletAssetsBalances,
  rates: ?RatesBySymbol,
  baseFiatCurrency: ?Currency,
): AssetOption => {
  const { symbol, iconUrl, address } = asset;

  const assetBalance = getBalance(balances, address);
  const formattedAssetBalance = assetBalance ? formatAmount(assetBalance) : '';
  const formattedBalanceInFiat = rates ? getFormattedBalanceInFiat(baseFiatCurrency, assetBalance, rates, symbol) : '';

  return {
    ...asset,
    imageUrl: iconUrl,
    formattedBalanceInFiat,
    icon: iconUrl,
    assetBalance: formattedAssetBalance,
    balance: getAssetOptionBalance(symbol, address, balances, rates, baseFiatCurrency),
    chain: CHAIN.ETHEREUM,
  };
};

export const mapAssetDataToAssetOption = (
  assetData: AssetData,
  balances?: ?WalletAssetsBalances,
  rates?: ?RatesBySymbol,
  fiatCurrency?: ?Currency,
): AssetOption => {
  return {
    symbol: assetData.token,
    address: assetData.contractAddress,
    decimals: assetData.decimals,
    name: assetData.name ?? '',
    imageUrl: assetData.icon,
    tokenType: assetData.tokenType ?? TOKENS,
    balance: getAssetOptionBalance(assetData.token, assetData.contractAddress, balances, rates, fiatCurrency),
    chain: CHAIN.ETHEREUM,
  };
};

export const convertUSDToFiat = (value: number, rates: RatesBySymbol = {}, fiatCurrency: Currency) => {
  const ethRates = rates[ETH];
  if (!ethRates || !ethRates[fiatCurrency] || !ethRates[USD]) {
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

type CollectibleMatch = { contractAddress: string, id: string };

export const isMatchingCollectible = (
  a: CollectibleMatch,
  b: CollectibleMatch,
) => a.contractAddress
  && addressesEqual(a.contractAddress, b.contractAddress)
  && a.id
  && a.id === b.id;

export const mapWalletAssetsBalancesIntoAssetsByAddress = (
  walletAssetsBalances: WalletAssetsBalances,
  chainSupportedAssets: Asset[],
): AssetByAddress => mapValues(
  walletAssetsBalances,
  ({ address }: WalletAssetBalance) => findAsset([], chainSupportedAssets, address),
);

export const sortSupportedAssets = (
  supportedChainAssets: AssetsPerChain,
) => mapValues(supportedChainAssets, sortAssetsArray);
