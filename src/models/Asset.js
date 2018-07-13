// @flow
export type Asset = {
  symbol: string,
  name: string,
  balance: number,
  address: string,
  description: string,
  iconUrl: string,
  iconMonoUrl: string,
  wallpaperUrl: string,
};

export type Assets = {
  [string]: Asset,
};
