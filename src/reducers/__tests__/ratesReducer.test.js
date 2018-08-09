// @flow
import { UPDATE_RATES } from 'constants/ratesConstants';
import reducer from '../ratesReducer';

describe('Rates reducer', () => {
  it('should handle UPDATE_RATES', () => {
    const updateAction = {
      type: UPDATE_RATES,
      payload: {
        ETH: {
          EUR: 624.21,
          GBP: 544.57,
          USD: 748.92,
        },
      },
    };
    const expectedRates = {
      data: {
        ETH: {
          EUR: 624.21,
          GBP: 544.57,
          USD: 748.92,
        },
      },
      isFetched: true,
    };
    expect(reducer(undefined, updateAction)).toMatchObject(expectedRates);
  });
});
