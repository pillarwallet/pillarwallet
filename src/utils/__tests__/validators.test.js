// @flow
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
    it('should return false if email isn\'t valid', () => {
      const email = 'jon@';
      expect(isValidEmail(email)).toBeFalsy();
    });

    it('should return true if email is valid', () => {
      const email = 'jon@snow.com';
      expect(isValidEmail(email)).toBeTruthy();
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
