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

// utils
import {
  getTotalBalanceInFiat,
  getBalance,
  balanceInEth,
  getRate,
  convertUSDToFiat,
} from 'utils/assets';

// types
import type { WalletAssetsBalances } from 'models/Balances';
import type { RatesBySymbol } from 'models/Rates';


describe('Assets utils', () => {
  const ETH_GBP = 10;
  const ETH_USD = 5;
  const PLR_ETH = 1.2;

  const rates = {
    ETH: { GBP: ETH_GBP, ETH: 1, USD: ETH_USD },
    PLR: { GBP: (PLR_ETH * ETH_GBP), ETH: PLR_ETH },
    AAA: { GBP: 3 },
  };

  describe('getRate', () => {
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
  });

  describe('balanceInEth', () => {
    it('returns the total in ETH', () => {
      const balances: WalletAssetsBalances = {
        ETH: { symbol: 'ETH', balance: '2.321000' },
        PLR: { symbol: 'PLR', balance: '1200' },
      };

      const balance = balanceInEth(balances, rates);

      expect(balance).toEqual(1442.321);
    });

    it('returns 0 when there are no rates for ETH', () => {
      const balances: WalletAssetsBalances = {
        PLR: { symbol: 'PLR', balance: '1200' },
      };

      const balance = balanceInEth(balances, { PLR: { GBP: 12 } });

      expect(balance).toEqual(0);
    });
  });

  describe('getBalance', () => {
    it('returns 0 for empty balance', () => {
      const balance = getBalance({}, 'ETH');

      expect(balance).toEqual(0);
    });

    it('returns the balance', () => {
      const balances: WalletAssetsBalances = {
        ETH: { symbol: 'ETH', balance: '2.321000' },
      };

      const balance = getBalance(balances, 'ETH');
      expect(balance).toEqual(2.321);
    });
  });

  describe('getTotalBalanceInFiat', () => {
    describe('for empty values', () => {
      it('returns 0', () => {
        const balances: WalletAssetsBalances = {};

        const balance = getTotalBalanceInFiat(balances, {}, 'GBP');

        expect(balance).toEqual(0);
      });
    });

    describe('when there are ETH and PLR assets', () => {
      describe('when assets have no rate', () => {
        it('returns 0 balance', () => {
          const balances: WalletAssetsBalances = {
            MANA: { symbol: 'MANA', balance: '1200.0' },
          };

          const balance = getTotalBalanceInFiat(balances, {}, 'GBP');

          expect(balance).toEqual(0);
        });
      });

      describe('having ETH balance', () => {
        const ethBalance = 1.2;

        it('returns the ETH balance', () => {
          const balances: WalletAssetsBalances = {
            ETH: { symbol: 'ETH', balance: `${ethBalance}` },
          };

          const balance = getTotalBalanceInFiat(balances, rates, 'GBP');

          expect(balance).toEqual(ethBalance * ETH_GBP);
        });

        describe('having also PLR balance', () => {
          const plrBalance = 3.4;

          it('returns the totals balance', () => {
            const balances: WalletAssetsBalances = {
              ETH: { symbol: 'ETH', balance: `${ethBalance}` },
              PLR: { symbol: 'PLR', balance: `${plrBalance}` },
            };

            const balance = getTotalBalanceInFiat(balances, rates, 'GBP');

            const plrEth = plrBalance * PLR_ETH;

            expect(balance).toEqual((ethBalance + plrEth) * ETH_GBP);
          });
        });
      });
    });
  });

  describe('convertUSDToFiat', () => {
    it('converts to GBP', () => {
      const converted = convertUSDToFiat(100, rates, 'GBP');
      expect(converted).toEqual(200);
    });
  });
});
