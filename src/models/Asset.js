// @flow
export type Asset = {
  symbol: string,
  name: string,
  balance: number,
  address: string,
  description: string,
  iconUrl: string,
};

export type Assets = {
  [string]: Asset,
};
