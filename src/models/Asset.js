// @flow
export type Asset = {
  symbol: string,
  name: string,
  balance: number,
  address: string,
  description: string,
};

export type Assets = {
  [string]: Asset,
};
