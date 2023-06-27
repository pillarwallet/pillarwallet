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
import { BigNumber as EthersBigNumber, utils } from 'ethers';
import { BigNumber } from 'bignumber.js';
import { get, isEmpty, mapValues, orderBy } from 'lodash';
import t from 'translations/translate';

// constants
import {
  defaultFiatCurrency,
  ETH,
  PLR,
  ASSET_TYPES,
  ONE_DAY,
  ONE_WEEK,
  ONE_MONTH,
  ONE_YEAR,
} from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';

// utils
import {
  formatAmount,
  formatFiat,
  isCaseInsensitiveMatch,
  reportOrWarn,
  addressAsKey,
  valueForAddress,
  reportErrorLog,
} from 'utils/common';
import { nativeAssetPerChain } from 'utils/chains';
import { getAssetRateInFiat } from 'utils/rates';
import { caseInsensitiveIncludes } from 'utils/strings';
import { getGasAddress } from 'utils/transactions';

// services
import etherspotService from 'services/etherspot';

// abi
import ERC20_CONTRACT_ABI from 'abi/erc20.json';

// types
import type {
  Asset,
  AssetByAddress,
  AssetData,
  AssetOption,
  AssetOptionBalance,
  AssetsPerChain,
  TokenData,
  MarketDetails,
  TokenDetails,
} from 'models/Asset';
import type { GasToken } from 'models/Transaction';
import type { WalletAssetBalance, WalletAssetsBalances } from 'models/Balances';
import type { Chain } from 'models/Chain';
import type { Currency, RatesByAssetAddress } from 'models/Rates';
import type { Value } from 'models/Value';
import { omitNilProps } from 'utils/object';
import type { AccountInvestmentPositionsInfo } from 'etherspot';
import type { EtherspotErc20Interface } from 'models/Etherspot';

const sortAssetsFn = (a: Asset, b: Asset): number => {
  return a.symbol.localeCompare(b.symbol);
};

export const sortAssetsArray = (assets: Asset[]): Asset[] => {
  return assets.sort(sortAssetsFn);
};

export const transformBalancesToObject = (balancesArray: WalletAssetBalance[] = []): WalletAssetsBalances =>
  balancesArray.reduce(
    (memo, balance) => ({
      ...memo,
      [addressAsKey(balance.address)]: balance,
    }),
    {},
  );

export const getAssetsAsList = (assetsObject: AssetByAddress): Asset[] => {
  return Object.keys(assetsObject).map((id) => assetsObject[id]);
};

export const sortAssets = (assets: AssetByAddress): Asset[] => {
  const assetsList = getAssetsAsList(assets);

  return sortAssetsArray(assetsList);
};

export const getBalanceBN = (balances: ?WalletAssetsBalances, assetAddress: ?string): BigNumber => {
  if (!balances || !assetAddress) return BigNumber('0');
  return BigNumber(valueForAddress(balances, assetAddress)?.balance ?? '0');
};

/**
 * @deprecated: do not use because of rounding issues
 */
export const getBalance = (balances: ?WalletAssetsBalances, assetAddress: string): number => {
  if (!balances) return 0;

  const assetBalance = valueForAddress(balances, assetAddress);
  if (!assetBalance) {
    return 0;
  }

  const number = new BigNumber(assetBalance.balance);

  return +formatAmount(number.toString());
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

  const gasAddress = getGasAddress(chain, gasToken);
  const feeSymbol = gasToken?.symbol || nativeAssetPerChain[chain].symbol;
  const feeDecimals = gasToken?.decimals || nativeAssetPerChain[chain].decimals;

  if (!valueForAddress(balances, gasAddress)) return false;

  const balance = getBalance(balances, gasAddress);

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

export const addressesEqual = (address1: ?string, address2: ?string): boolean => {
  if (address1 === address2) return true;
  if (!address1 || !address2) return false;

  return isCaseInsensitiveMatch(address1, address2);
};

/** Checks if address list contains given address. Similar to `Array.includes`.  */
export const addressesInclude = (addresses: string[], addressToFind: ?string): boolean => {
  return addresses.some((item) => isCaseInsensitiveMatch(item, addressToFind));
};

export const isSupportedAssetAddress = (supportedAssets: Asset[], addressToCheck: ?string): boolean => {
  return supportedAssets.some((asset: Asset) => addressesEqual(asset.address, addressToCheck));
};

export const findAssetByAddress = (assets: ?(Asset[]), addressToFind: ?string): ?Asset =>
  assets?.find((asset) => addressesEqual(asset.address, addressToFind));

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
  tokenType: ASSET_TYPES.TOKEN,
  icon: iconUrl,
});

export const getBalanceInFiat = (
  baseFiatCurrency: ?Currency,
  assetBalance: ?Value,
  rates: RatesByAssetAddress,
  assetAddress: string,
): number => {
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const assetBalanceInFiat = assetBalance
    ? parseFloat(assetBalance.toString()) * getAssetRateInFiat(rates, assetAddress, fiatCurrency)
    : 0;
  return assetBalanceInFiat;
};

export const getFormattedBalanceInFiat = (
  baseFiatCurrency: ?Currency,
  assetBalance: ?Value,
  rates: RatesByAssetAddress,
  assetAddress: string,
): string => {
  const assetBalanceInFiat = getBalanceInFiat(baseFiatCurrency, assetBalance, rates, assetAddress);
  if (!assetBalanceInFiat) return '';
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  return assetBalanceInFiat ? formatFiat(assetBalanceInFiat, fiatCurrency) : '';
};

const getAssetOptionBalance = (
  symbol: string,
  address: string,
  balances: ?WalletAssetsBalances,
  rates: ?RatesByAssetAddress,
  fiatCurrency: ?Currency,
): ?AssetOptionBalance => {
  if (!balances) return null;

  const balance = getBalance(balances, address);
  const balanceInFiat = rates ? getBalanceInFiat(fiatCurrency, balance, rates, address) : undefined;
  const value = rates ? getFormattedBalanceInFiat(fiatCurrency, balance, rates, address) : undefined;

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
  rates: ?RatesByAssetAddress,
  baseFiatCurrency: ?Currency,
  chain: Chain,
): AssetOption => {
  const { symbol, iconUrl, address } = asset;

  const assetBalance = getBalance(balances, address);
  const formattedAssetBalance = assetBalance ? formatAmount(assetBalance) : '';
  const formattedBalanceInFiat = rates ? getFormattedBalanceInFiat(baseFiatCurrency, assetBalance, rates, address) : '';

  return {
    ...asset,
    imageUrl: iconUrl,
    formattedBalanceInFiat,
    icon: iconUrl,
    assetBalance: formattedAssetBalance,
    balance: getAssetOptionBalance(symbol, address, balances, rates, baseFiatCurrency),
    chain,
  };
};

export const getAssetOptionKey = (option: ?AssetOption) => {
  if (!option) return '';
  return `${option.chain}-${option.address ?? option.contractAddress}-${option.symbol}`;
};

export const isAssetOptionMatchedByQuery = (option: AssetOption, query: ?string) => {
  if (!query) return true;
  return (
    caseInsensitiveIncludes(option.name, query) ||
    caseInsensitiveIncludes(option.symbol, query) ||
    caseInsensitiveIncludes(option.address, query)
  );
};

export const mapAssetDataToAsset = (assetData: TokenData, chain: Chain): Asset => {
  return {
    chain,
    address: assetData.contractAddress,
    symbol: assetData.token,
    decimals: assetData.decimals,
    name: assetData.name ?? assetData.token ?? '',
    iconUrl: assetData?.icon ?? '',
  };
};

export const mapAssetDataToAssetOption = (
  assetData: TokenData,
  balances?: ?WalletAssetsBalances,
  rates?: ?RatesByAssetAddress,
  fiatCurrency?: ?Currency,
): AssetOption => {
  return {
    symbol: assetData.token,
    address: assetData.contractAddress,
    decimals: assetData.decimals,
    name: assetData.name ?? '',
    imageUrl: assetData.icon,
    tokenType: assetData.tokenType ?? ASSET_TYPES.TOKEN,
    balance: getAssetOptionBalance(assetData.token, assetData.contractAddress, balances, rates, fiatCurrency),
    chain: CHAIN.ETHEREUM,
    iconUrl: assetData?.icon ?? '',
  };
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

export const isMatchingCollectible = (a: CollectibleMatch, b: CollectibleMatch) =>
  a.contractAddress && addressesEqual(a.contractAddress, b.contractAddress) && a.id && a.id === b.id;

export const mapWalletAssetsBalancesIntoAssetsByAddress = (
  walletAssetsBalances: WalletAssetsBalances,
  chainSupportedAssets: Asset[],
): AssetByAddress => {
  const assetsByAddress = mapValues(walletAssetsBalances, ({ address }: WalletAssetBalance) =>
    findAssetByAddress(chainSupportedAssets, address),
  );

  // removes assets that were not found / no longer supported
  return omitNilProps(assetsByAddress);
};

export const sortSupportedAssets = (supportedChainAssets: AssetsPerChain) =>
  mapValues(supportedChainAssets, sortAssetsArray);

export const isNativeAsset = (chain: ?Chain, assetAddress: ?string) => {
  if (!chain || !assetAddress) return false;

  const nativeAsset = nativeAssetPerChain[chain];
  return addressesEqual(assetAddress, nativeAsset?.address);
};

export const sortInvestmentPositions = (positionsInfo: AccountInvestmentPositionsInfo[]) => {
  const positionsInfoList = [];
  positionsInfo.forEach((newArr) => {
    newArr.forEach((item) => {
      positionsInfoList.push(item);
    });
  });

  if (isEmpty(positionsInfoList)) return null;

  const newArr = [];
  positionsInfoList.forEach((x) => {
    // Checking if there is any object in arr2
    // which contains the key value
    // eslint-disable-next-line i18next/no-literal-string
    const key = 'metaType';
    if (
      newArr.some((val) => {
        return val[key] === x[key];
      })
    ) {
      // If yes! then push the arr by metaType value
      newArr.forEach((k) => {
        if (k[key] === x[key]) {
          k.data.push(x);
        }
      });
    } else {
      // If not! Then create a new object initialize
      // it with the present iteration key's value and
      const a = {};
      a[key] = x[key];
      a.data = [x];
      newArr.push(a);
    }
  });
  return newArr;
};

export const isSameAsset = (a: Asset, b: Asset) =>
  a.symbol === b.symbol && a?.address?.toLowerCase() === b?.address?.toLowerCase();

export const isTokenAvailableInList = (tokensList: Asset[], token: Asset): boolean => {
  if (isEmpty(tokensList) || !token) return false;
  return tokensList?.some((tokenA) => isSameAsset(token, tokenA));
};

export const getGraphPeriod = (period?: string) => {
  const durationList = [
    {
      id: ONE_DAY,
      label: t('button.twentyfour_hour'),
      balanceLabel: t('button.today'),
    },
    {
      id: ONE_WEEK,
      label: t('button.seven_day'),
      balanceLabel: t('button.last_week'),
    },
    {
      id: ONE_MONTH,
      label: t('button.one_month'),
      balanceLabel: t('button.last_month'),
    },
    {
      id: ONE_YEAR,
      label: t('button.one_year'),
      balanceLabel: t('button.last_year'),
    },
  ];

  if (!period) return durationList;
  return durationList.find((periodInfo) => periodInfo.id === period);
};

export const getPriceChangePercentage = (
  period: string,
  marketData: MarketDetails,
  tokenDetailsData?: TokenDetails,
) => {
  const zeroValue = 0;

  if (period === ONE_DAY) {
    return marketData?.priceChangePercentage24h || tokenDetailsData?.priceChangePercentage24h || zeroValue;
  }
  if (period === ONE_WEEK) {
    return marketData?.priceChangePercentage7d || zeroValue;
  }
  if (period === ONE_MONTH) {
    return marketData?.priceChangePercentage1m || zeroValue;
  }
  return marketData?.priceChangePercentage1y || zeroValue;
};

export const getAssetsToAddress = async (chain: Chain, contractAddress: string) => {
  try {
    const erc20Contract = etherspotService.getContract<?EtherspotErc20Interface>(
      chain,
      ERC20_CONTRACT_ABI,
      contractAddress,
    );

    if (!erc20Contract) {
      reportErrorLog('getAssetsToAddress failed: no erc20Contract on getAssetsToAddress', {
        contractAddress,
        chain,
      });
      return null;
    }

    const name = await erc20Contract.callName();
    const symbol = await erc20Contract.callSymbol();
    const decimals = await erc20Contract.callDecimals();

    return {
      address: contractAddress,
      chain,
      name,
      symbol,
      decimals,
      iconUrl: null,
    };
  } catch (error) {
    reportErrorLog('Contract address to get token details: getAssetsToAddress failed', {
      error,
      chain,
    });
    return null;
  }
};

export const getChainsAssetsToAddress = async (supportedChains: Chain[], contractAddress: string) => {
  const assets = await Promise.all(supportedChains?.map((chain) => getAssetsToAddress(chain, contractAddress))).catch(
    (error) => {
      reportErrorLog('Contract address to get token details fot supported chains: getChainsAssetsToAddress failed', {
        error,
        supportedChains,
      });
      return null;
    },
  );
  return assets ? assets.filter((asset) => !!asset) : [];
};

export const getUrlToSymbol = (
  chain: Chain,
  supportedChains: Chain[],
  supportedChainAssets: AssetsPerChain,
  symbol: string,
) => {
  if (!symbol) return null;
  const assetData = getAssetToSymbol(chain, supportedChainAssets, symbol);
  if (assetData) return assetData.iconUrl;

  const isWrappedToken = symbol.charAt(0) === 'W';
  if (isWrappedToken) {
    const wrappedAssetData = getAssetToSymbol(chain, supportedChainAssets, symbol.slice(1));
    if (wrappedAssetData) return wrappedAssetData.iconUrl;
  }

  const assets = supportedChains?.map((supportedChain) =>
    getAssetToSymbol(supportedChain, supportedChainAssets, symbol),
  );

  const assetDataPerChain = assets.find((asset) => !!asset);

  if (assetDataPerChain) return assetDataPerChain.iconUrl;

  return null;
};

const getAssetToSymbol = (chain: Chain, supportedChainAssets: AssetsPerChain, symbol: string) => {
  const supportedAssets = supportedChainAssets[chain];
  return supportedAssets?.find((asset: Asset) => asset.symbol === symbol);
};

export const getActivityKeyExtractor = (item: any, index: number) => item.amm + index.toString();
