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
  hasAllValues,
  isValidEmail,
  isValidPhone,
} from 'utils/validators';
import t from 'translations/translate';

describe('Validators', () => {
  describe('validatePin', () => {
    it('should validate the length of provided pincode', () => {
      const pin = '123456';
      const expectedErrorMessage = t('auth:error.invalidPin_tooLong', { requiredLength: 6 });
      expect(validatePin(pin)).toHaveLength(0);
      expect(validatePin('1')).toBe(expectedErrorMessage);
    });

    it('should allow only digits', () => {
      const expectedErrorMessage = t('auth:error.invalidPin_useNumericSymbolsOnly');
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
      const phone = '+447473222885';
      expect(isValidPhone(phone)).toBeTruthy();
    });
  });

  it('should return false for missing +', () => {
    const phone = '447473222885';
    expect(isValidPhone(phone)).toBeFalsy();
  });
});
