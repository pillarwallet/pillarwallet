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
import { providers } from 'ethers';
import { INFURA_PROJECT_ID } from 'react-native-dotenv';

export function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      clearTimeout(timeout);
      resolve();
    }, ms);
  });
}

export function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min; // eslint-disable-line
}

export function decodeETHAddress(encodedAddress: string) {
  if (!encodedAddress || encodedAddress.substr(0, 9) !== 'ethereum:') {
    return encodedAddress;
  }
  if (encodedAddress.length >= 51) {
    return encodedAddress.substr(9, 42);
  }
  return encodedAddress;
}

export function pipe(...fns: Function[]) {
  return fns.reduceRight((a, b) => (...args) => a(b(...args)));
}

export function noop() {}

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
export function formatMoney(
  src: number | string,
  n: number = 2,
  x: number = 3,
  s: ?string = ',',
  c: ?string = '.',
  stripZeros: ?boolean = true,
): string {
  const re = `\\d(?=(\\d{${x || 3}})+${n > 0 ? '\\D' : '$'})`;
  let num = new BigNumber(src).toFixed(Math.max(0, Math.floor(n)), 1);

  if (stripZeros) {
    num = Number(num).toString();
  }

  return (c ? num.replace('.', c) : num).replace(new RegExp(re, 'g'), `$&${s || ','}`);
}

export function parseNumber(amount: string = '0') {
  let strg = amount.toString() || '';
  let decimal = '.';
  strg = strg.replace(/[^0-9$.,]/g, '');
  if (strg.indexOf(',') > strg.indexOf('.')) decimal = ',';
  if ((strg.match(new RegExp(`\\${decimal}`, 'g')) || []).length > 1) decimal = '';
  strg = strg.replace(new RegExp(`[^0-9$${decimal}]`, 'g'), '');
  strg = strg.replace(',', '.');
  return parseFloat(strg);
}

export function isValidNumber(amount: string = '0') {
  const strg = amount.toString() || '';
  const numericalSymbols = strg.replace(/[^0-9$.,]/g, '');
  if (numericalSymbols.includes(',.') || numericalSymbols.includes('.,')) return false;
  if (numericalSymbols.length !== strg.length) return false;
  if ((strg.match(new RegExp('\\.', 'g')) || []).length > 1) return false;
  if ((strg.match(new RegExp(',', 'g')) || []).length > 1) return false;
  return true;
}

export function formatAmount(amount: string | number, precision: number = 6): string {
  const roundedNumber = new BigNumber(amount).toFixed(precision, 1); // 1 = ROUND_DOWN
  return new BigNumber(roundedNumber).toFixed(); // strip trailing zeros
}

export function formatFullAmount(amount: string | number): string {
  return new BigNumber(amount).toFixed(); // strip trailing zeros
}

export function getCurrencySymbol(currency: string): string {
  const currencies = {
    USD: '$',
    GBP: '£',
    EUR: '€',
  };
  return currencies[currency] || '';
}

export function partial(fn: Function, ...fixedArgs: any) {
  return (...rest: any) => {
    return fn.apply(null, [...fixedArgs, ...rest]);
  };
}

export function uniqBy(collection: Object[] = [], key: string): Object[] {
  return collection.filter((item, i, arr) => {
    return arr.map(it => it[key]).indexOf(item[key]) === i;
  });
}

export const isIphoneX = () => {
  const d = Dimensions.get('window');
  const { height, width } = d;

  return (
    // This has to be iOS duh
    Platform.OS === 'ios' &&
    // Accounting for the height in either orientation
    (height === 812 || width === 812)
  );
};

export const getiOSNavbarHeight = () => {
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
  navigationOptions: {
    header: null,
  },
  transitionConfig: () => ({
    transitionSpec: {
      duration: 400,
      easing: Easing.out(Easing.poly(2)),
      timing: Animated.timing,
    },
    screenInterpolator: (sceneProps: Object) => {
      const { layout, position, scene } = sceneProps;
      const { index } = scene;

      const height = layout.initHeight;
      const translateY = position.interpolate({
        inputRange: [index - 1, index, index + 1],
        outputRange: [height, 0, 0],
      });

      const opacity = position.interpolate({
        inputRange: [index - 1, index - 0.99, index],
        outputRange: [0, 1, 1],
      });

      return { opacity, transform: [{ translateY }] };
    },
  }),
};

const WWW_URL_PATTERN = /^www\./i;

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

export function getEthereumProvider(network: string) {
  // Connect to INFURA
  const infuraNetwork = network === 'homestead' ? 'mainnet' : network;
  const infuraUrl = `https://${infuraNetwork}.infura.io/v3/${INFURA_PROJECT_ID}`;
  const infuraProvider = new providers.JsonRpcProvider(infuraUrl, network);

  // Connect to Etherscan
  const etherscanProvider = new providers.EtherscanProvider(network);

  // Creating a provider to automatically fallback onto Etherscan
  // if INFURA is down
  return new providers.FallbackProvider([infuraProvider, etherscanProvider]);
}

export function padWithZeroes(value: string, length: number): string {
  let myString = `${value}`;
  while (myString.length < length) {
    myString = `0${myString}`;
  }
  return myString;
}

export function concatSig({ v, r, s }): string {
  const rSig = ethUtil.fromSigned(r);
  const sSig = ethUtil.fromSigned(s);
  const vSig = ethUtil.bufferToInt(v);
  const rStr = padWithZeroes(ethUtil.toUnsigned(rSig).toString('hex'), 64);
  const sStr = padWithZeroes(ethUtil.toUnsigned(sSig).toString('hex'), 64);
  const vStr = ethUtil.stripHexPrefix(ethUtil.intToHex(vSig));
  return ethUtil.addHexPrefix(rStr.concat(sStr, vStr)).toString('hex');
}

export function ethSign(msgHex: String, privateKeyHex: string): string {
  const message = ethUtil.toBuffer(msgHex);
  const privateKey = ethUtil.toBuffer(privateKeyHex);
  const sigParams = ethUtil.ecsign(message, privateKey);
  const result = concatSig(sigParams);
  return result;
}
