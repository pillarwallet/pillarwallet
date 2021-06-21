// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

// constants
import { UPDATE_CHAIN_RATES, SET_RATES } from 'constants/ratesConstants';
import { CHAIN } from 'constants/chainConstants';

// reducer
import ratesReducer from 'reducers/ratesReducer';

describe('RatesBySymbol ratesReducer', () => {
  it('should handle SET_RATES', () => {
    const updateAction = {
      type: SET_RATES,
      payload: {
        ethereum: {
          ETH: {
            EUR: 624.21,
            GBP: 544.57,
            USD: 748.92,
          },
        },
      },
    };
    const expectedRates = {
      data: {
        ethereum: {
          ETH: {
            EUR: 624.21,
            GBP: 544.57,
            USD: 748.92,
          },
        },
      },
      isFetching: false,
    };
    expect(ratesReducer(undefined, updateAction)).toMatchObject(expectedRates);
  });

  it('should handle UPDATE_CHAIN_RATES', () => {
    const updateAction = {
      type: UPDATE_CHAIN_RATES,
      payload: {
        chain: CHAIN.ETHEREUM,
        rates: {
          ETH: {
            EUR: 624.21,
            GBP: 544.57,
            USD: 748.92,
          },
        },
      },
    };
    const expectedRates = {
      data: {
        ethereum: {
          ETH: {
            EUR: 624.21,
            GBP: 544.57,
            USD: 748.92,
          },
        },
      },
      isFetching: false,
    };
    expect(ratesReducer(undefined, updateAction)).toMatchObject(expectedRates);
  });
});
