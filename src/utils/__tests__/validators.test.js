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
  isValidEmail,
  isValidPhone,
} from 'utils/validators';

import {
  keyPairAddress,
  rootFromMnemonic,
} from 'services/bitcoin';

const newBTCAddress = (keyPair) => {
  const address = keyPairAddress(keyPair);

  if (!address) {
    throw Error('cannot generate address');
  }

  return address;
};

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

  describe('isValidETHAddress', () => {
    it('should return true for the valid ETH address', () => {
      const isValid = isValidETHAddress('0xb0604b2d7FBD6cD53f00fA001504135b7aEC9B4D');
      expect(isValid).toBeTruthy();
    });

    it('should return true for the valid ENS name', () => {
      const isValid = isValidETHAddress('test.eth');
      expect(isValid).toBeTruthy();
    });

    it('should return true for the valid ENS name with subdomain', () => {
      const isValid = isValidETHAddress('pillar.test.eth');
      expect(isValid).toBeTruthy();
    });

    it('should return false for the unsupported ENS name', () => {
      const isValid = isValidETHAddress('test.com');
      expect(isValid).toBeFalsy();
    });

    it('should return false for the wrong ENS name', () => {
      const isValid = isValidETHAddress('testeth');
      expect(isValid).toBeFalsy();
    });

    it('should return false for the invalid ETH address', () => {
      const isValid = isValidETHAddress('Jon Snow');
      expect(isValid).toBeFalsy();
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

        const address = newBTCAddress(keyPair);

        const isValid = isValidBTCAddress(address, 'testnet');
        expect(isValid).toBeTruthy();
      });

      it('does not accept bitcoin address', async () => {
        const root = await rootFromMnemonic(mnemonic, 'bitcoin');
        const keyPair = root.derivePath("m/49'/1/0");

        const address = newBTCAddress(keyPair);

        const isValid = isValidBTCAddress(address, 'testnet');
        expect(isValid).toBeFalsy();
      });
    });

    describe('for bitcoin network', () => {
      it('does not accept testnet address', async () => {
        const root = await rootFromMnemonic(mnemonic, 'testnet');
        const keyPair = root.derivePath("m/49'/1/0");

        const address = newBTCAddress(keyPair);

        const isValid = isValidBTCAddress(address, 'bitcoin');
        expect(isValid).toBeFalsy();
      });

      it('accepts bitcoin address', async () => {
        const root = await rootFromMnemonic(mnemonic, 'bitcoin');
        const keyPair = root.derivePath("m/49'/1/0");

        const address = newBTCAddress(keyPair);

        const isValid = isValidBTCAddress(address, 'bitcoin');
        expect(isValid).toBeTruthy();
      });
    });
  });

  describe('hasAllValues', () => {
    it('should return true for an object with all values', () => {
      const object = { foo: 1, bar: false };
      expect(hasAllValues(object)).toBeTruthy();
    });
    it('should return false for an object without all values', () => {
      const object = { foo: 1, bar: false, baz: '' };
      expect(hasAllValues(object)).toBeFalsy();
    });
  });

  describe('validateEmail', () => {
    it('should return false for jon@', () => {
      const email = 'jon@';
      expect(isValidEmail(email)).toBeFalsy();
    });

    it('should return true for jon@snow.com', () => {
      const email = 'jon@snow.com';
      expect(isValidEmail(email)).toBeTruthy();
    });

    it('should return false for the email with leading spaces', () => {
      const email = '    jon@snow.com';
      expect(isValidEmail(email)).toBeFalsy();
    });
  });

  describe('isValidPhone', () => {
    it('should return true as valid number', () => {
      const phone = '7473222885';
      expect(isValidPhone(phone)).toBeTruthy();
    });
  });
});
