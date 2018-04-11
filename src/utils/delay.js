// @flow
export function delay(ms: number): Promise {
  return new Promise((resolve) => {
    const timeout = setTimeout(() => {
      clearTimeout(timeout);
      resolve();
    }, ms);
  });
}

export default {
  delay,
};
