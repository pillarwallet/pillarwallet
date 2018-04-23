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
