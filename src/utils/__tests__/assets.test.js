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
import { ethers } from 'ethers';

// utils
import { getBalance } from 'utils/assets';
import { convertValueInUsdToFiat, getRate } from 'utils/rates';

// types
import type { WalletAssetsBalances } from 'models/Balances';
import type { RatesByAssetAddress } from 'models/Rates';

describe('Assets utils', () => {
  const ETH_GBP = 10;
  const ETH_USD = 5;
  const TKN_USD = 1.5;
  const TKN_GBP = 3;

  const mockEthAddress = ethers.constants.AddressZero;
  const mockTknAddress = '0x';
  const mockNoEthRateTknAddress = '0x1';
  const mockInvalidTknAddress = '0x2';

  const rates: RatesByAssetAddress = {
    [mockEthAddress]: { GBP: ETH_GBP, USD: ETH_USD },
    [mockTknAddress]: { GBP: TKN_GBP, USD: TKN_USD },
  };

  describe('getRate', () => {
    describe('for ethereum tokens', () => {
      it('returns the rate', () => {
        const rate = getRate(rates, mockTknAddress, 'GBP');

        expect(rate).toEqual(TKN_GBP);
      });

      describe('for invalid token', () => {
        it('returns 0', () => {
          const rate = getRate(rates, mockInvalidTknAddress, 'GBP');

          expect(rate).toEqual(0);
        });
      });

      describe('for token that has no ETH rate', () => {
        it('returns fiat rate', () => {
          const rate = getRate(rates, mockNoEthRateTknAddress, 'GBP');

          expect(rate).toEqual(TKN_GBP);
        });
      });
    });

    describe('for ETH', () => {
      it('returns the rate', () => {
        const rate = getRate(rates, mockEthAddress, 'GBP');

        expect(rate).toEqual(ETH_GBP);
      });
    });
  });

  describe('getBalance', () => {
    it('returns 0 for empty balance', () => {
      const balance = getBalance({}, mockEthAddress);

      expect(balance).toEqual(0);
    });

    it('returns the balance', () => {
      const balances: WalletAssetsBalances = {
        [mockEthAddress]: { symbol: 'ETH', balance: '2.321000', address: mockEthAddress },
      };

      const balance = getBalance(balances, mockEthAddress);
      expect(balance).toEqual(2.321);
    });
  });

  describe('convertUSDToFiat', () => {
    it('converts to GBP', () => {
      const converted = convertValueInUsdToFiat(100, rates, 'GBP');
      expect(converted).toEqual(200);
    });
  });
});
