// @flow
import type { Asset } from 'models/Asset';

export const includes = (value: string, searchValue: string): boolean => {
  if (!value || !searchValue) return false;
  return value.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase());
};


export const findList = (erc20Tokens: Array<Asset>, searchValue: string, size: number = 20): Array<Asset> => {
  if (!searchValue) return [];
  return erc20Tokens.filter(({ name, symbol }) => {
    return includes(name, searchValue) || includes(symbol, searchValue);
  }).slice(0, size);
};
