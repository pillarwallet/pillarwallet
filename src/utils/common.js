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

import * as Sentry from '@sentry/react-native';
import isEmpty from 'lodash.isempty';
import orderBy from 'lodash.orderby';
import { BigNumber } from 'bignumber.js';
import { Dimensions, Platform, Linking, PixelRatio, AppState, StatusBar } from 'react-native';
import { providers, utils, BigNumber as EthersBigNumber } from 'ethers';
import { CardStyleInterpolators } from 'react-navigation-stack';
import t from 'translations/translate';
import { getEnv } from 'configs/envConfig';

// constants
import {
  defaultFiatCurrency,
  CURRENCY_SYMBOLS,
  ETHEREUM_ADDRESS_PREFIX,
  ETH,
  HIGH_VALUE_TOKENS,
} from 'constants/assetsConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// services
import etherspotService from 'services/etherspot';
import { firebaseRemoteConfig } from 'services/firebase';

// utils
import { wrapBigNumber } from 'utils/bigNumber';
import { nativeAssetPerChain } from 'utils/chains';

// types
import type { Chain } from 'models/Chain';
import type { GasToken } from 'models/Transaction';
import type { Value } from 'models/Value';
import type { EnsRegistry } from 'reducers/ensRegistryReducer';
import type { Record } from 'utils/object';

// local
import { humanizeDateString, formatDate } from './date';
import { isProdEnv, isTest } from './environment';

export { BigNumber } from 'bignumber.js';
export { isIphoneX } from 'react-native-iphone-x-helper';

/**
 * Empty object with stable reference.
 *
 * Can be used as a return value in non-memoized selectors instead of `{}` to prevent unnecessary re-renders.
 */
export const EMPTY_OBJECT: {} = Object.freeze({});

/**
 * Empty array with stable reference.
 *
 * Can be used as a return value in non-memoized selectors instead of `[]` to prevent unnecessary re-renders.
 */
export const EMPTY_ARRAY = Object.freeze([]);

const WWW_URL_PATTERN = /^www\./i;
// eslint-disable-next-line i18next/no-literal-string
const supportedAddressPrefixes = new RegExp(`^(?:${ETHEREUM_ADDRESS_PREFIX}):`, 'gi');

export const printLog = (...params: any) => {
  if ((isProdEnv() && !__DEV__) || isTest) return;
  console.log(...params); // eslint-disable-line
};

export const errorLog = (...params: any) => {
  if ((isProdEnv() && !__DEV__) || isTest) return;
  console.error(...params); // eslint-disable-line
};

export const reportLog = (message: string, extra?: Object, level: Sentry.Severity = Sentry.Severity.Info) => {
  Sentry.withScope((scope) => {
    scope.setExtras({ extra, level });
    if (level === Sentry.Severity.Info) {
      Sentry.captureMessage(message, Sentry.Severity.Info);
    } else {
      Sentry.captureException(new Error(message));
    }
  });
  printLog(`${level}: ${message}`, extra);
};

export const reportErrorLog = (message: string, extra?: Object) => {
  reportLog(message, extra, Sentry.Severity.Error);
};

export const logBreadcrumb = (
  category: string,
  message: string,
  extra: any,
  level: Sentry.Severity = Sentry.Severity.Info,
) => {
  if (__DEV__) {
    if (extra != null) printLog(`${level} - ${category}: ${message}`, extra);
    else printLog(`${level} - ${category}: ${message}`);
  }

  const data = extra != null && typeof extra === 'object' ? extra : { extra };
  Sentry.addBreadcrumb({
    category,
    message,
    level,
    data,
  });
};

export const reportOrWarn = (message: string, extra?: Object, level: Sentry.Severity = Sentry.Severity.Info) => {
  if (__DEV__) {
    console.error(message, extra); // eslint-disable-line no-console
    return;
  }
  reportLog(message, extra, level);
};

export const delay = async (ms: number) => {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      clearTimeout(timeout);
      resolve();
    }, ms);
  });
};

export const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * ((max - min) + 1)) + min;
};

/**
 * Extracts the address part from a string on the form of '[prefix]:[address]'
 *
 * Examples:
 *   decodeAddress('ethereum', 'ethereum:0xaddress') -> 0xaddress
 *
 * @param prefix         String the prefix part
 * @param encodedAddress String the '[prefx]:[address]' string
 *
 * @return String the address part
 */
const decodeAddress = (prefix: string, encodedAddress: string): string => {
  if (isEmpty(encodedAddress)) return '';

  const len = prefix.length + 1;

  if (encodedAddress.startsWith(`${prefix}:`)) {
    return encodedAddress.substr(len);
  }

  return encodedAddress;
};

export const decodeETHAddress = (encodedAddress: string): string => {
  return decodeAddress(ETHEREUM_ADDRESS_PREFIX, encodedAddress);
};

export const decodeSupportedAddress = (encodedAddress: string): string => {
  return encodedAddress.replace(supportedAddressPrefixes, '');
};

export const pipe = (...fns: Function[]) => {
  return fns.reduceRight((a, b) => (...args) => a(b(...args)));
};

export const noop = () => {};

/**
 * formatMoney(n, x, s, c)
 *
 * @param src         Mixed  number to format
 * @param n           Integer length of decimal
 * @param x           Integer length of whole part
 * @param s           Mixed   sections delimiter
 * @param c           Mixed   decimal delimiter
 * @param stripZeros  Boolean set true to strip trailing zeros
 */
export const formatMoney = (
  src: number | string,
  n: number = 2,
  x: number = 3,
  s: ?string = ',',
  c: ?string = '.',
  stripZeros: ?boolean = true,
): string => {
  const re = `\\d(?=(\\d{${x || 3}})+${n > 0 ? '\\D' : '$'})`; // eslint-disable-line i18next/no-literal-string
  let num = new BigNumber(src).toFixed(Math.max(0, Math.floor(n)), 1);

  if (stripZeros) {
    num = Number(num).toString();
  }

  return (c ? num.replace('.', c) : num).replace(new RegExp(re, 'g'), `$&${s || ','}`);
};

export const parseNumber = (amount: Value = '0') => {
  let strg = amount.toString();
  let decimal = '.';
  strg = strg.replace(/[^0-9$.,]/g, '');
  if (strg.indexOf(',') > strg.indexOf('.')) decimal = ',';
  if ((strg.match(new RegExp(`\\${decimal}`, 'g')) || []).length > 1) decimal = '';
  strg = strg.replace(new RegExp(`[^0-9$${decimal}]`, 'g'), '');
  strg = strg.replace(',', '.');

  return parseFloat(strg);
};

export const isValidNumber = (amount: Value = '0') => {
  const strg = amount.toString();
  const numericalSymbols = strg.replace(/[^0-9$.,]/g, '');

  if (numericalSymbols.includes(',.') || numericalSymbols.includes('.,')) return false;
  if (numericalSymbols.length !== strg.length) return false;
  if ((strg.match(new RegExp('\\.', 'g')) || []).length > 1) return false;
  if ((strg.match(new RegExp(',', 'g')) || []).length > 1) return false;

  return true;
};

export const getDecimalPlaces = (assetSymbol: ?string): number => {
  if (assetSymbol === ETH) return 4;
  if (HIGH_VALUE_TOKENS.includes(assetSymbol)) return 8;

  return firebaseRemoteConfig.getNumber(REMOTE_CONFIG.EXCHANGE_AMOUNT_DECIMAL_PLACES);
};

export const formatAmount = (amount: Value, precision: number = 6): string => {
  const roundedNumber = wrapBigNumber(amount).toFixed(precision, 1); // 1 = ROUND_DOWN
  return new BigNumber(roundedNumber).toFixed(); // strip trailing zeros
};

/**
 * Truncate amount if needed, preserves trailing zeros.
 */
export const truncateAmount = (amount: Value, precision: ?number): string => {
  const amountBN = wrapBigNumber(amount);

  return precision != null && amountBN.decimalPlaces() > precision
    ? amountBN.toFixed(precision, 1) // 1 = ROUND_DOWN
    : amountBN.toString();
};

/**
 * Checks if given value has too much decimal places for available precission.
 * It also rejects NaNs & infinite values.
 */
export const hasTooMuchDecimals = (value: Value, decimals: ?number): boolean => {
  const valueBN = wrapBigNumber(value);

  if (!valueBN.isFinite()) return false;

  if (decimals == null) return true;

  return valueBN.decimalPlaces() > decimals;
};

export const formatTokenAmount = (amount: Value, assetSymbol: ?string): string =>
  formatAmount(amount, getDecimalPlaces(assetSymbol));

export const formatFullAmount = (amount: string | number): string => {
  return new BigNumber(amount).toFixed(); // strip trailing zeros
};

export const parseTokenBigNumberAmount = (amount: number | string, decimals: ?number): utils.BigNumber => {
  let formatted = amount.toString();
  const [whole, fraction] = formatted.split('.');
  if (decimals != null && decimals > 0) {
    if (fraction && fraction.length > decimals) {
      formatted = `${whole}.${fraction.substring(0, decimals)}`;
    }
    return utils.parseUnits(formatted, decimals);
  }
  return EthersBigNumber.from(formatted);
};

export const parseTokenAmount = (amount: number | string, decimals: number): number => {
  const parsed = parseTokenBigNumberAmount(amount, decimals);
  return Math.floor(+parsed.toString());
};

export const getCurrencySymbol = (currency: string): string => {
  return CURRENCY_SYMBOLS[currency] || '';
};

export const commify = (src: Value, options?: { skipCents?: boolean }): string => {
  const REGEX = '\\d(?=(\\d{3})+\\D)';
  const num = wrapBigNumber(src).toFixed(2);
  let formatedValue = num.replace(new RegExp(REGEX, 'g'), '$&,');
  if (options?.skipCents) {
    formatedValue = formatedValue.substring(0, formatedValue.length - 3);
  }
  return formatedValue;
};

export const formatFiatValue = (value: Value, options?: { skipCents?: boolean }): string => {
  const formatedValue = commify(value, options);
  return `${parseFloat(formatedValue) > 0 ? formatedValue : 0}`;
};

export const formatFiat = (value: Value, baseFiatCurrency?: ?string, options?: { skipCents?: boolean }): string => {
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  return `${getCurrencySymbol(fiatCurrency)}${formatFiatValue(value, options)}`;
};

export const partial = (fn: Function, ...fixedArgs: any) => {
  return (...rest: any) => {
    return fn.apply(null, [...fixedArgs, ...rest]);
  };
};

export const uniqBy = (collection: Object[] = [], key: string): Object[] => {
  return collection.filter((item, i, arr) => {
    return arr.map((it) => it[key]).indexOf(item[key]) === i;
  });
};

export const getiOSNavbarHeight = (): number => {
  const { height, width } = Dimensions.get('window');

  // for iPhone X and iPhone XS
  const X_WIDTH = 375;
  const X_HEIGHT = 812;

  // for iPhone XS Max and iPhone XR
  const XSMAX_WIDTH = 414;
  const XSMAX_HEIGHT = 896;

  if (Platform.OS === 'ios') {
    if ((width === X_WIDTH && height === X_HEIGHT) || (width === XSMAX_WIDTH && height === XSMAX_HEIGHT)) {
      return 44;
    }
    return 20;
  }

  return 0;
};

export const modalTransition = {
  mode: 'modal',
  defaultNavigationOptions: {
    headerShown: false,
    cardStyleInterpolator: CardStyleInterpolators.forVerticalIOS,
  },
};

export const handleUrlPress = (url: string) => {
  if (WWW_URL_PATTERN.test(url)) {
    handleUrlPress(`http://${url}`);
  } else {
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) Linking.openURL(url);
      })
      .catch(() => null);
  }
};

export const addAppStateChangeListener = (callback: Function) => AppState.addEventListener('change', callback);

export const removeAppStateChangeListener = (callback: Function) => AppState.removeEventListener('change', callback);

export const smallScreen = () => {
  if (Platform.OS === 'ios') {
    return Dimensions.get('window').width * PixelRatio.get() < 650;
  }
  return Dimensions.get('window').width < 410;
};

export const getEthereumProvider = (network: string) => {
  // Connect to INFURA
  const infuraProjectId = firebaseRemoteConfig.getString(REMOTE_CONFIG.INFURA_PROJECT_ID) || getEnv().INFURA_PROJECT_ID;
  const infuraProvider = new providers.InfuraProvider(network, infuraProjectId);

  // Connect to Etherscan
  const etherscanProvider = new providers.EtherscanProvider(network);

  // Creating a provider to automatically fallback onto Etherscan
  // if INFURA is down
  return new providers.FallbackProvider([infuraProvider, etherscanProvider]);
};

export const resolveEnsName = async (ensName: string): Promise<?string> => {
  const resolved = await etherspotService.getEnsNode(ensName);

  return resolved?.address;
};

export const lookupAddress = async (address: string): Promise<?string> => {
  const resolved = await etherspotService.getEnsNode(address);

  return resolved?.name;
};

export const formatUnits = (val: Value = '0', decimals: number): string => {
  let formattedUnits = decimals === 0 ? '0' : '0.0';
  let preparedValue = null; // null for sentry reports
  let valueWithoutDecimals: string | null = null; // null for sentry reports
  try {
    // check if val is exact number or other format (might be hex, exponential, etc.)
    preparedValue = isValidNumber(val) ? Math.floor(+val) : val;
    // parse number as BigNumber and get as string expresion without decimals
    valueWithoutDecimals = new BigNumber(preparedValue.toString()).toFixed();
    if (decimals === 0) {
      // check additionally if string contains decimal pointer
      // because converting exponential numbers back to number will result as exponential expression again
      if (valueWithoutDecimals.includes('.')) return Math.floor(+valueWithoutDecimals).toFixed();
      // else return as it is
      return valueWithoutDecimals;
    }
    formattedUnits = utils.formatUnits(valueWithoutDecimals, decimals);
  } catch (e) {
    reportLog(e.message, {
      sourceFunction: 'formatUnits(value,decimals)',
      inputValue: val,
      preparedValue,
      valueWithoutDecimals,
      decimals,
    });
  }
  return formattedUnits;
};

type SectionData = {|
  title: string,
  data: any[],
|};

// all default values makes common sense and usage
export const groupSectionsByDate = (
  data: any[],
  timestampMultiplier: number = 1000,
  dateField: string = 'createdAt',
  sortDirection: string = 'desc',
): SectionData[] => {
  const sections: { [string]: SectionData } = {};

  orderBy(data, [dateField], [sortDirection]).forEach((item) => {
    const safeTimestamp = parseTimestamp(item[dateField]);
    const date = new Date(safeTimestamp * timestampMultiplier);
    const key = formatDate(date, 'yyyy-MM-dd');

    const existingSection = sections[key];
    if (!existingSection) {
      sections[key] = {
        title: humanizeDateString(date),
        data: [{ ...item }],
      };
    } else {
      existingSection.data.push({ ...item });
    }
  });

  // $FlowFixMe: should be fine
  return Object.values(sections);
};

export const fetchJsonFromUrl = (url: string): Promise<any> =>
  fetch(url, { cache: 'force-cache' })
    .then((response) => response.json())
    .then((json) => json)
    .catch((error) => {
      reportErrorLog('fetchJsonFromUrl failed!', { url, error });
      return null;
    });

export const isCaseInsensitiveMatch = (a: ?string, b: ?string): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
};

export const getDeviceHeight = () => {
  return Dimensions.get('window').height;
};

export const getDeviceWidth = () => {
  return Dimensions.get('window').width;
};

export const getDeviceHeightWithoutNotch = () => {
  const deviceHeight = getDeviceHeight();
  if (Platform.OS === 'ios') return deviceHeight - 100;
  else if (Platform.OS === 'android') return deviceHeight - (StatusBar.currentHeight || 0);
  return deviceHeight;
};

export const getFormattedTransactionFeeValue = (chain: Chain, feeInWei: ?Value, gasToken: ?GasToken): string => {
  if (!feeInWei) return '';

  const parsedFeeInWei = wrapBigNumber(feeInWei).toFixed();

  if (gasToken && !isEmpty(gasToken)) {
    return formatAmount(utils.formatUnits(parsedFeeInWei, gasToken.decimals), 2);
  }

  const nativeAssetDecimals = nativeAssetPerChain[chain].decimals;
  return formatAmount(utils.formatUnits(parsedFeeInWei, nativeAssetDecimals));
};

export const formatTransactionFee = (
  chain: Chain,
  feeInWei: ?BigNumber | string | number,
  gasToken: ?GasToken,
): string => {
  if (!feeInWei) return '';

  const token = gasToken?.symbol || nativeAssetPerChain[chain].symbol;
  const value = getFormattedTransactionFeeValue(chain, feeInWei, gasToken);

  return t('tokenValue', { value, token });
};

export const humanizeHexString = (hexString: ?string) => {
  if (!hexString) return '';

  const startCharsCount = 6;
  const endCharsCount = 4;
  const separator = '...';
  const totalTruncatedSum = startCharsCount + endCharsCount + separator.length;

  const words = hexString.toString().split(' ');
  const firstWord = words[0];

  if (words.length === 1) {
    if (firstWord.length <= totalTruncatedSum) return firstWord;
    return `${firstWord.slice(0, startCharsCount)}${separator}${firstWord.slice(-endCharsCount)}`;
  }

  return hexString;
};

export const findEnsNameCaseInsensitive = (ensRegistry: EnsRegistry, address: string): ?string => {
  const addressMixedCase = Object.keys(ensRegistry).find((key) => isCaseInsensitiveMatch(key, address));
  if (!addressMixedCase) return null;
  return ensRegistry[addressMixedCase];
};

export const getEnsPrefix = () =>
  isProdEnv()
    ? '.pillar.eth' // eslint-disable-line i18next/no-literal-string
    : '.pillar'; // eslint-disable-line i18next/no-literal-string

export const hitSlop10 = {
  top: 10,
  bottom: 10,
  left: 10,
  right: 10,
};

export const hitSlop20 = {
  top: 20,
  bottom: 20,
  left: 20,
  right: 20,
};

export const hitSlop50w20h = {
  top: 20,
  bottom: 20,
  left: 50,
  right: 50,
};

export const truncateAddress = (address: string) => {
  if (address.length < 13) return address;

  return `${address.substring(0, 6)}...${address.substring(address.length - 6)}`;
};

export const formatBigAmount = (value: Value) => {
  const _value = wrapBigNumber(value);

  if (_value.gte(1e12)) {
    // eslint-disable-next-line i18next/no-literal-string
    return `${_value.dividedBy(1e12).toFixed(2)}T`;
  }

  if (_value.gte(1e9)) {
    // eslint-disable-next-line i18next/no-literal-string
    return `${_value.dividedBy(1e9).toFixed(2)}B`;
  }

  if (_value.gte(1e6)) {
    // eslint-disable-next-line i18next/no-literal-string
    return `${_value.dividedBy(1e6).toFixed(2)}M`;
  }

  if (_value.gte(1e3)) {
    // eslint-disable-next-line i18next/no-literal-string
    return `${_value.dividedBy(1e3).toFixed(2)}K`;
  }

  return _value.toFixed(2);
};

export const formatBigFiatAmount = (value: Value, fiatCurrency: string) => {
  const currencySymbol = getCurrencySymbol(fiatCurrency);
  return `${currencySymbol}${formatBigAmount(value)}`;
};

export const getEnsName = (username: string) => `${username}${getEnsPrefix()}`;

export const extractUsernameFromEnsName = (ensName: string) => ensName.replace(getEnsPrefix(), '');

export const addressAsKey = (address: ?string): string => address?.toLowerCase() ?? '';

export const valueForAddress = <V>(record: ?Record<V>, address: ?string): ?V => record?.[addressAsKey(address)];

export const setValueForAddress = <V>(record: Record<V>, address: string, value: V) => {
  record[addressAsKey(address)] = value;
};

export const parseTimestamp = (date: Date | string | number): number => new Date(date).getTime();
