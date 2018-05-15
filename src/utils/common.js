// @flow
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

export function formatETHAmount(amount: number) {
  return +parseFloat(amount).toFixed(6);
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
 * @param src Mixed  number to format
 * @param n   Integer length of decimal
 * @param x   Integer length of whole part
 * @param s   Mixed   sections delimiter
 * @param c   Mixed   decimal delimiter
 */
export function formatMoney(
  src: number | string,
  n: number = 2,
  x: number = 3,
  s: ?string = ',',
  c: ?string = '.',
): string {
  const re = `\\d(?=(\\d{${x || 3}})+${n > 0 ? '\\D' : '$'})`;
  const num = Number(src).toFixed(Math.max(0, Math.floor(n)));

  return (c ? num.replace('.', c) : num).replace(new RegExp(re, 'g'), `$&${s || ','}`);
}

export function getCurrencySymbol(currency: string): string {
  const currencies = {
    USD: '$',
    GBP: '£',
    EUR: '€',
  };
  return currencies[currency] || '';
}
