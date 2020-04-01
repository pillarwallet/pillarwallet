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
import { Sentry } from 'react-native-sentry';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import orderBy from 'lodash.orderby';
import { BigNumber } from 'bignumber.js';
import * as ethUtil from 'ethereumjs-util';
import {
  Dimensions,
  Platform,
  Animated,
  Easing,
  Linking,
  PixelRatio,
  AppState,
  DeviceEventEmitter,
} from 'react-native';
import { providers, utils } from 'ethers';
import { format as formatDate } from 'date-fns';
import { INFURA_PROJECT_ID, NETWORK_PROVIDER } from 'react-native-dotenv';
import type { GasInfo } from 'models/GasInfo';
import type { NavigationTransitionProps as TransitionProps } from 'react-navigation';
import { StackViewStyleInterpolator } from 'react-navigation-stack';
import {
  defaultFiatCurrency,
  CURRENCY_SYMBOLS,
  ETHEREUM_ADDRESS_PREFIX,
  BITCOIN_ADDRESS_PREFIX,
} from 'constants/assetsConstants';
import { MANAGE_USERS_FLOW } from 'constants/navigationConstants';

const WWW_URL_PATTERN = /^www\./i;
const supportedAddressPrefixes = new RegExp(
  `^(?:${ETHEREUM_ADDRESS_PREFIX}|${BITCOIN_ADDRESS_PREFIX}):`, 'gi',
);

export const stringWithoutSpaces = (s: string): string => {
  return s.replace(/\s/g, '');
};

export const delay = async (ms: number) => {
  return new Promise(resolve => {
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
 *   decodeAddress('bitcoin', 'bitcoin:1address') -> 1address
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

export const decodeBTCAddress = (encodedAddress: string): string => {
  return decodeAddress(BITCOIN_ADDRESS_PREFIX, encodedAddress);
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
  const re = `\\d(?=(\\d{${x || 3}})+${n > 0 ? '\\D' : '$'})`;
  let num = new BigNumber(src).toFixed(Math.max(0, Math.floor(n)), 1);

  if (stripZeros) {
    num = Number(num).toString();
  }

  return (c ? num.replace('.', c) : num).replace(new RegExp(re, 'g'), `$&${s || ','}`);
};

export const parseNumber = (amount: string = '0') => {
  let strg = amount.toString();
  let decimal = '.';
  strg = strg.replace(/[^0-9$.,]/g, '');
  if (strg.indexOf(',') > strg.indexOf('.')) decimal = ',';
  if ((strg.match(new RegExp(`\\${decimal}`, 'g')) || []).length > 1) decimal = '';
  strg = strg.replace(new RegExp(`[^0-9$${decimal}]`, 'g'), '');
  strg = strg.replace(',', '.');

  return parseFloat(strg);
};

export const isValidNumber = (amount: string = '0') => {
  const strg = amount.toString();
  const numericalSymbols = strg.replace(/[^0-9$.,]/g, '');

  if (numericalSymbols.includes(',.') || numericalSymbols.includes('.,')) return false;
  if (numericalSymbols.length !== strg.length) return false;
  if ((strg.match(new RegExp('\\.', 'g')) || []).length > 1) return false;
  if ((strg.match(new RegExp(',', 'g')) || []).length > 1) return false;

  return true;
};

export const formatAmount = (amount: string | number, precision: number = 6): string => {
  const roundedNumber = new BigNumber(amount).toFixed(precision, 1); // 1 = ROUND_DOWN

  return new BigNumber(roundedNumber).toFixed(); // strip trailing zeros
};

export const formatFullAmount = (amount: string | number): string => {
  return new BigNumber(amount).toFixed(); // strip trailing zeros
};

export const parseTokenBigNumberAmount = (amount: number | string, decimals: number): utils.BigNumber => {
  const formatted = amount.toString();
  return decimals > 0
    ? utils.parseUnits(formatted, decimals)
    : utils.bigNumberify(formatted);
};

export const parseTokenAmount = (amount: number | string, decimals: number): number => {
  const parsed = parseTokenBigNumberAmount(amount, decimals);
  return Math.floor(+parsed.toString());
};

export const getCurrencySymbol = (currency: string): string => {
  return CURRENCY_SYMBOLS[currency] || '';
};

export const formatFiat = (src: number | string, baseFiatCurrency?: ?string): string => {
  const re = '\\d(?=(\\d{3})+\\D)';
  const num = new BigNumber(src).toFixed(2);
  const formatedValue = num.replace(new RegExp(re, 'g'), '$&,');
  const value = parseFloat(formatedValue) > 0 ? formatedValue : 0;
  const fiatCurrency = baseFiatCurrency || defaultFiatCurrency;
  const currencySymbol = getCurrencySymbol(fiatCurrency);

  return `${currencySymbol} ${value}`;
};

export const partial = (fn: Function, ...fixedArgs: any) => {
  return (...rest: any) => {
    return fn.apply(null, [...fixedArgs, ...rest]);
  };
};

export const uniqBy = (collection: Object[] = [], key: string): Object[] => {
  return collection.filter((item, i, arr) => {
    return arr.map(it => it[key]).indexOf(item[key]) === i;
  });
};

export const isIphoneX = (): boolean => {
  const d = Dimensions.get('window');
  const { height, width } = d;

  return (
    // This has to be iOS duh
    Platform.OS === 'ios' &&
    // Accounting for the height in either orientation
    (height === 812 || width === 812)
  );
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

const DEFAULT_TRANSITION_SCREENS = [MANAGE_USERS_FLOW];

const getIfNeedsDefTransition = (transitionProps: TransitionProps, prevTransitionProps: TransitionProps) => {
  return DEFAULT_TRANSITION_SCREENS.some(
    screenName =>
      screenName === transitionProps.scene.route.routeName ||
      (prevTransitionProps && screenName === prevTransitionProps.scene.route.routeName),
  );
};

const getTransitionDuration = (isFaster: boolean) => {
  let duration = 400;
  if (isFaster && Platform.OS === 'android') {
    duration = 250;
  }
  return duration;
};

const getTransitionSpec = (isFasterAnimation: boolean) => ({
  duration: getTransitionDuration(isFasterAnimation),
  easing: Easing.out(Easing.poly(2)),
  timing: Animated.timing,
});

export const modalTransition = {
  mode: 'modal',
  defaultNavigationOptions: {
    header: null,
  },
  transitionConfig: (transitionProps: TransitionProps, prevTransitionProps: TransitionProps) => ({
    transitionSpec: getTransitionSpec(getIfNeedsDefTransition(transitionProps, prevTransitionProps)),
    screenInterpolator: (sceneProps: TransitionProps) => {
      const needsDefaultTransition = getIfNeedsDefTransition(transitionProps, prevTransitionProps);
      if (needsDefaultTransition) {
        return Platform.OS === 'ios'
          ? StackViewStyleInterpolator.forHorizontal(sceneProps)
          : StackViewStyleInterpolator.forFadeFromBottomAndroid(sceneProps);
      }

      const { layout, position, scene } = sceneProps;
      const { index } = scene;
      const opacity = position.interpolate({
        inputRange: [index - 1, index - 0.99, index],
        outputRange: [0, 1, 1],
      });

      const height = layout.initHeight;
      const translateY = position.interpolate({
        inputRange: [index - 1, index, index + 1],
        outputRange: [height, 0, 0],
      });
      return { opacity, transform: [{ translateY }] };
    },
  }),
};

export const handleUrlPress = (url: string) => {
  if (WWW_URL_PATTERN.test(url)) {
    handleUrlPress(`http://${url}`);
  } else {
    Linking.canOpenURL(url)
      .then(supported => {
        if (supported) Linking.openURL(url);
      })
      .catch(() => null);
  }
};

export const addAppStateChangeListener = (callback: Function) => {
  return Platform.OS === 'ios'
    ? AppState.addEventListener('change', callback)
    : DeviceEventEmitter.addListener('ActivityStateChange', callback);
};

export const removeAppStateChangeListener = (callback: Function) => {
  return Platform.OS === 'ios'
    ? AppState.removeEventListener('change', callback)
    : DeviceEventEmitter.removeListener('ActivityStateChange', callback);
};

export const smallScreen = () => {
  if (Platform.OS === 'ios') {
    return Dimensions.get('window').width * PixelRatio.get() < 650;
  }
  return Dimensions.get('window').width < 410;
};

export const getEthereumProvider = (network: string) => {
  // Connect to INFURA
  const infuraProvider = new providers.InfuraProvider(network, INFURA_PROJECT_ID);

  // Connect to Etherscan
  const etherscanProvider = new providers.EtherscanProvider(network);

  // Creating a provider to automatically fallback onto Etherscan
  // if INFURA is down
  return new providers.FallbackProvider([infuraProvider, etherscanProvider]);
};

export const resolveEnsName = (ensName: string): Promise<?string> => {
  const provider = getEthereumProvider(NETWORK_PROVIDER);
  return provider.resolveName(ensName);
};

export const lookupAddress = async (address: string): Promise<?string> => {
  const provider = getEthereumProvider(NETWORK_PROVIDER);
  let ensName;
  try {
    ensName = await provider.lookupAddress(address);
  } catch (_) {
    //
  }
  return ensName;
};

export const padWithZeroes = (value: string, length: number): string => {
  let myString = value;

  while (myString.length < length) {
    myString = `0${myString}`;
  }

  return myString;
};

export const concatSig = ({ v, r, s }): string => {
  const rSig = ethUtil.fromSigned(r);
  const sSig = ethUtil.fromSigned(s);
  const vSig = ethUtil.bufferToInt(v);
  const rStr = padWithZeroes(ethUtil.toUnsigned(rSig).toString('hex'), 64);
  const sStr = padWithZeroes(ethUtil.toUnsigned(sSig).toString('hex'), 64);
  const vStr = ethUtil.stripHexPrefix(ethUtil.intToHex(vSig));

  return ethUtil.addHexPrefix(rStr.concat(sStr, vStr)).toString('hex');
};

export const ethSign = (msgHex: String, privateKeyHex: string): string => {
  const message = ethUtil.toBuffer(msgHex);
  const privateKey = ethUtil.toBuffer(privateKeyHex);
  const sigParams = ethUtil.ecsign(message, privateKey);
  const result = concatSig(sigParams);

  return result;
};

export const getRandomString = (): string => {
  return utils.bigNumberify(utils.randomBytes(32)).toHexString().slice(2);
};

export const extractJwtPayload = (jwtToken: string): Object => {
  // extract: header (not needed), payload, signature (not needed)
  const [, encodedPayload] = jwtToken.split('.');

  try {
    // do not use Buffer.toJSON
    return JSON.parse(Buffer.from(encodedPayload, 'base64').toString());
  } catch (e) {
    return {};
  }
};

export const getGasPriceWei = (gasInfo: GasInfo): BigNumber => {
  const gasPrice = get(gasInfo, 'gasPrice.max', 0);

  return utils.parseUnits(gasPrice.toString(), 'gwei');
};

export const formatUnits = (val: string = '0', decimals: number) => {
  let formattedUnits = decimals === 0 ? '0' : '0.0';
  let preparedValue = null; // null for sentry reports
  let valueWithoutDecimals = null; // null for sentry reports
  try {
    // check if val is exact number or other format (might be hex, exponential, etc.)
    preparedValue = isValidNumber(val) ? Math.floor(+val) : val;
    // parse number as BigNumber and get as string expresion without decimals
    valueWithoutDecimals = new BigNumber(preparedValue.toString()).toFixed();
    if (decimals === 0) {
      // check additionally if string contains decimal pointer
      // because converting exponential numbers back to number will result as exponential expression again
      if (valueWithoutDecimals.includes('.')) return Math.floor(valueWithoutDecimals).toFixed();
      // else return as it is
      return valueWithoutDecimals;
    }
    formattedUnits = utils.formatUnits(valueWithoutDecimals, decimals);
  } catch (e) {
    Sentry.captureMessage(e.message, {
      level: 'info',
      extra: {
        sourceFunction: 'formatUnits(value,decimals)',
        inputValue: val,
        preparedValue,
        valueWithoutDecimals,
        decimals,
      },
    });
  }
  return formattedUnits;
};

type GroupedAndSortedData = {|
  title: string,
  date: string,
  data: any[],
|};

// all default values makes common sense and usage
export const groupAndSortByDate = (
  data: any[],
  timestampMultiplier?: number = 1000,
  dateField?: string = 'createdAt',
  sortDirection?: string = 'desc',
): GroupedAndSortedData[] => {
  const grouped = [];
  orderBy(data, [dateField], [sortDirection]).forEach(listItem => {
    const dateValue = timestampMultiplier
      ? listItem[dateField] * timestampMultiplier
      : listItem[dateField];
    const itemCreatedDate = new Date(dateValue);
    const formattedDate = formatDate(itemCreatedDate, 'MMM D YYYY');
    // don't show the year if the event happened this year
    const titleDateFormat = itemCreatedDate.getFullYear() === new Date().getFullYear()
      ? 'MMM D'
      : 'MMM D YYYY';
    const sectionTitle = formatDate(itemCreatedDate, titleDateFormat);
    const existingSection = grouped.find(({ date }) => date === formattedDate);
    if (!existingSection) {
      grouped.push({ title: sectionTitle, date: formattedDate, data: [{ ...listItem }] });
    } else {
      existingSection.data.push({ ...listItem });
    }
  });
  return grouped;
};

export const isCaseInsensitiveMatch = (a: ?string, b: ?string): boolean => {
  if (a === b) return true;
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
};

// number with decimals is valid if it has decimals else if not then it should not contain any decimal pointer
export const isValidNumberDecimals = (
  number: number | string,
  decimals: number,
) => decimals !== 0 || !number.toString().includes('.');

/**
 * helps to avoid text overlapping on many decimals,
 * full amount will be displayed in confirm screen
 * also show only 2 decimals for amounts above 1.00
 * to avoid same text overlapping in the other side
 */
export const formatAmountDisplay = (value: number | string) => {
  if (!value) return 0;
  const amount = parseFloat(value);
  if (amount > 1) {
    return formatMoney(amount, 2);
  }
  return amount > 0.00001 ? formatMoney(amount, 5) : '<0.00001';
};

export const getDeviceHeight = () => {
  return Dimensions.get('window').height;
};
