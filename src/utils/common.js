// @flow
import { BigNumber } from 'bignumber.js';
import { Dimensions, Platform, Animated, Easing } from 'react-native';

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
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

export function noop() { }

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

