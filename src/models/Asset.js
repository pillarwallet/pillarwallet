// @flow
export type Asset = {
  symbol: string,
  name: string,
  balance: number,
  address: string,
};

export type Assets = {
  [string]: Asset,
};
