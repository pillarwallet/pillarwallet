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
import {
  validatePin,
  isValidETHAddress,
  isValidBTCAddress,
  hasAllValues,
  isValidFullname,
  isValidEmail,
  isValidName,
  isValidCityName,
  isValidUKPhone,
} from 'utils/validators';

import {
  keyPairAddress,
  rootFromMnemonic,
} from 'services/bitcoin';

describe('Validators', () => {
  describe('validatePin', () => {
    it('should validate the length of provided pincode', () => {
      const pin = '123456';
      const expectedErrorMessage = 'Invalid pin\'s length (should be 6 numbers)';
      expect(validatePin(pin)).toHaveLength(0);
      expect(validatePin('1')).toBe(expectedErrorMessage);
    });

    it('should allow only digits', () => {
      const expectedErrorMessage = 'Pin could contain numbers only';
      expect(validatePin('1asdsd')).toBe(expectedErrorMessage);
    });
  });

  describe('isValidBTCAddress', () => {
    const mnemonic = 'some super random words';

    describe('for testnet', () => {
      it('does not accept ETH addresses', () => {
        const isValid = isValidBTCAddress('0xb0604b2d7FBD6cD53f00fA001504135b7aEC9B4D');
        expect(isValid).toBeFalsy();
      });

      it('does not accept invalid addresses', () => {
        const isValid = isValidETHAddress('Jon Snow');
        expect(isValid).toBeFalsy();
      });

      it('accepts testnet address', async () => {
        const root = await rootFromMnemonic(mnemonic, 'testnet');
        const keyPair = root.derivePath("m/49'/1/0");

        const address = keyPairAddress(keyPair);

        const isValid = isValidBTCAddress(address, 'testnet');
        expect(isValid).toBeTruthy();
      });

      it('does not accept bitcoin address', async () => {
        const root = await rootFromMnemonic(mnemonic, 'bitcoin');
        const keyPair = root.derivePath("m/49'/1/0");

        const address = keyPairAddress(keyPair);

        const isValid = isValidBTCAddress(address, 'testnet');
        expect(isValid).toBeFalsy();
      });
    });

    describe('for bitcoin network', () => {
      it('does not accept testnet address', async () => {
        const root = await rootFromMnemonic(mnemonic, 'testnet');
        const keyPair = root.derivePath("m/49'/1/0");

        const address = keyPairAddress(keyPair);

        const isValid = isValidBTCAddress(address, 'bitcoin');
        expect(isValid).toBeFalsy();
      });

      it('accepts bitcoin address', async () => {
        const root = await rootFromMnemonic(mnemonic, 'bitcoin');
        const keyPair = root.derivePath("m/49'/1/0");

        const address = keyPairAddress(keyPair);

        const isValid = isValidBTCAddress(address, 'bitcoin');
        expect(isValid).toBeTruthy();
      });
    });
  });

  describe('isValidETHAddress', () => {
    it('returns true for the valid ETH address', () => {
      const isValid = isValidETHAddress('0xb0604b2d7FBD6cD53f00fA001504135b7aEC9B4D');
      expect(isValid).toBeTruthy();
    });

    it('returns false for the invalid ETH address', () => {
      const isValid = isValidETHAddress('Jon Snow');
      expect(isValid).toBeFalsy();
    });
  });

  describe('hasAllValues', () => {
    it('returns true for an object with all values', () => {
      const object = { foo: 1, bar: false };
      expect(hasAllValues(object)).toBeTruthy();
    });
    it('returns false for an object without all values', () => {
      const object = { foo: 1, bar: false, baz: '' };
      expect(hasAllValues(object)).toBeFalsy();
    });
  });

  describe('isValidFullname', () => {
    it('returns false if fullName is not present', () => {
      const fullName = '';
      expect(isValidFullname(fullName)).toBeFalsy();
    });

    it('returns false if fullName has only one part', () => {
      const fullName = 'Jon';
      expect(isValidFullname(fullName)).toBeFalsy();
    });

    it('returns true for a valid fullname', () => {
      // minimal critera to contain two parts
      const fullName = 'Jon Snow';
      expect(isValidFullname(fullName)).toBeTruthy();
    });
  });

  describe('validateEmail', () => {
    it('returns false for jon@', () => {
      const email = 'jon@';
      expect(isValidEmail(email)).toBeFalsy();
    });

    it('returns true for jon@snow.com', () => {
      const email = 'jon@snow.com';
      expect(isValidEmail(email)).toBeTruthy();
    });

    it('returns false for the email with leading spaces', () => {
      const email = '    jon@snow.com';
      expect(isValidEmail(email)).toBeFalsy();
    });
  });

  describe('isValidName', () => {
    it('returns false if name isn\'t valid', () => {
      const name = 'P1R@T3';
      expect(isValidName(name)).toBeFalsy();
    });

    it('returns true if name is valid', () => {
      const name = 'Jonathan';
      expect(isValidName(name)).toBeTruthy();
    });
  });

  describe('isValidCityName', () => {
    it('returns false if city name isn\'t valid', () => {
      const cityName = 'S3ct0r 9!';
      expect(isValidCityName(cityName)).toBeFalsy();
    });

    it('returns true if city name is valid', () => {
      const cityName = 'San Fransisco';
      expect(isValidCityName(cityName)).toBeTruthy();
    });
  });

  describe('isValidUKPhone', () => {
    it('returns true as valid number', () => {
      const phone = '+447473222885';
      expect(isValidUKPhone(phone)).toBeTruthy();
    });

    it('returns false for too long number', () => {
      const phone = '+4474732228852';
      expect(isValidUKPhone(phone)).toBeFalsy();
    });

    it('returns false for other prefix than +44', () => {
      const phone = '+407473222885';
      expect(isValidUKPhone(phone)).toBeFalsy();
    });

    it('returns false for missing +', () => {
      const phone = '447473222885';
      expect(isValidUKPhone(phone)).toBeFalsy();
    });
  });
});
