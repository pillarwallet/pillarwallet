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
  return fns.reduceRight((a, b) => (...args) => a(b(...args)))
}

export function noop() { }