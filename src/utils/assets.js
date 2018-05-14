// @flow
import cryptocompare from 'cryptocompare';

export function transformAssetsToObject(assetsArray: Object[] = []): Object {
  return assetsArray.reduce((memo, asset) => {
    memo[asset.symbol] = asset;
    return memo;
  }, {});
}

// TODO: remove and mock
/* const cryptocompare = {
  priceMulti: (tokensArray, priceMulti) => { // eslint-disable-line
    return Promise.resolve({
      ETH: {
        EUR: 624.21,
        GBP: 544.57,
        USD: 748.92,
      },
      PLR: {
        EUR: 0.3142,
        GBP: 0.2762,
        USD: 0.377,
      },
    });
  },
}; */

export function getExchangeRates(assets: string[]): Promise<?Object> {
  return cryptocompare.priceMulti(assets, ['USD', 'EUR', 'GBP']);
}
