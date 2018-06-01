// @flow
import { validatePin, isValidETHAddress, hasAllValues, isValidFullname } from '../validators';

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
});
