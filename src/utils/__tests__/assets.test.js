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
import { getRate } from 'utils/assets';

describe('Assets utils', () => {
  describe('getRate', () => {
    const rates = {
      AAA: {
        GBP: 0.03099,
        EUR: 0.03466,
        USD: 0.03871,
      },
      PLR: {
        GBP: 0.03099,
        EUR: 0.03466,
        USD: 0.03871,
        ETH: 0.0001753,
      },
      BTC: {
        GBP: 8007.71,
        EUR: 8956.69,
        USD: 10003.02,
        ETH: 45.29,
      },
      ETH: {
        GBP: 178.72,
        EUR: 197.93,
        USD: 220.72,
        ETH: 1,
      },
    };

    describe('for ethereum tokens', () => {
      it('returns the rate', () => {
        const rate = getRate(rates, 'PLR', 'GBP');

        expect(rate).toEqual(rates.PLR.ETH * rates.ETH.GBP);
      });

      describe('for invalid token', () => {
        it('returns 0', () => {
          const rate = getRate(rates, 'ZZZ', 'GBP');

          expect(rate).toEqual(0);
        });
      });

      describe('for token that has no ETH rate', () => {
        it('returns fiat rate', () => {
          const rate = getRate(rates, 'AAA', 'GBP');

          expect(rate).toEqual(rates.AAA.GBP);
        });
      });
    });

    describe('for ETH', () => {
      it('returns the rate', () => {
        const rate = getRate(rates, 'ETH', 'GBP');

        expect(rate).toEqual(rates.ETH.GBP);
      });
    });

    describe('for BTC', () => {
      it('returns the rate', () => {
        const rate = getRate(rates, 'BTC', 'GBP');

        expect(rate).toEqual(rates.BTC.GBP);
      });
    });
  });
});
