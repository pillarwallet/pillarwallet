// @flow
// This json file is taken from: https://github.com/dexlab-io/tokens-info-api
import erc20Tokens from 'utils/erc20Tokens.json';

const includes = (value: string, searchValue: string): boolean => {
  if (!value || !searchValue) return false;
  return value.toLocaleLowerCase().includes(searchValue.toLocaleLowerCase());
};

const findList = (searchValue: string, size: number = 20): Array<Object> => {
  if (!searchValue) return [];
  return erc20Tokens.filter(token => {
    const value = token.name + token.symbol;
    return includes(value, searchValue);
  }).slice(0, size);
};

export default {
  includes,
  findList,
};
