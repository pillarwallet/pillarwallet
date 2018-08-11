// @flow
export type Asset = {
  symbol: string,
  name: string,
  address: string,
  description: string,
  iconUrl: string,
  iconMonoUrl: string,
  wallpaperUrl: string,
};

export type Assets = {
  [string]: Asset,
};

export type Balances = {
  [string]: {
    balance: string,
    symbol: string,
  },
};

export type Rates = {
  [string]: {
    [string]: number,
  },
};
