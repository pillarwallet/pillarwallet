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
  isValidFullname,
  isValidEmail,
  isValidName,
  isValidCityName,
} from '../validators';

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

    it('should return false for the invvalid ETH address', () => {
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

  describe('isValidFullname', () => {
    it('should return false if fullName is not present', () => {
      const fullName = '';
      expect(isValidFullname(fullName)).toBeFalsy();
    });

    it('should return false if fullName has only one part', () => {
      const fullName = 'Jon';
      expect(isValidFullname(fullName)).toBeFalsy();
    });

    it('should return true for a valid fullname', () => {
      // minimal critera to contain two parts
      const fullName = 'Jon Snow';
      expect(isValidFullname(fullName)).toBeTruthy();
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

  describe('isValidName', () => {
    it('should return false if name isn\'t valid', () => {
      const name = 'P1R@T3';
      expect(isValidName(name)).toBeFalsy();
    });

    it('should return true if name is valid', () => {
      const name = 'Jonathan';
      expect(isValidName(name)).toBeTruthy();
    });
  });

  describe('isValidCityName', () => {
    it('should return false if city name isn\'t valid', () => {
      const cityName = 'S3ct0r 9!';
      expect(isValidCityName(cityName)).toBeFalsy();
    });

    it('should return true if city name is valid', () => {
      const cityName = 'San Fransisco';
      expect(isValidCityName(cityName)).toBeTruthy();
    });
  });
});
