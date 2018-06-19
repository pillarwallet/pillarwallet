// @flow
import {
  delay,
  formatETHAmount,
  decodeETHAddress,
  pipe,
  parseNumber,
  isValidNumber,
  formatMoney,
} from '../common';

describe('Common utils', () => {
  describe('delay', () => {
    it('should return a resolved delayed promise with specified timeout', () => {
      const timeout = 500;
      let value;
      delay(timeout).then(() => {
        value = true;
      }).catch(() => {});
      expect(value).toBeUndefined();
      setTimeout(() => {
        expect(value).not.toBeUndefined();
      }, timeout + 1);
    });
  });

  describe('formatETHAmount', () => {
    it('should format ETH amount to a readable one', () => {
      const expectedAmount = 0.00042;
      expect(formatETHAmount(0.00042000001)).toBe(expectedAmount);
    });
  });

  describe('decodeETHAddress', () => {
    it('should get ETH address from string provided', () => {
      const expectedAddress = '0xf74b153d202ab7368aca04efb71cb3c8c316b514';
      expect(decodeETHAddress('ethereum:0xf74b153d202ab7368aca04efb71cb3c8c316b514')).toBe(expectedAddress);
    });
  });

  describe('pipe', () => {
    it('should return a function composition', () => {
      const toLower = (str) => str.toLowerCase();
      const emptyJoin = (arr) => arr.join(' ');
      const expectedOutput = 'pillar';
      const func = pipe(emptyJoin, toLower);
      expect(func(['PILLAR'])).toBe(expectedOutput);
    });
  });

  describe('parseNumber', () => {
    it('should convert a comma separated number (as string) to a decimal separated number', () => {
      const expectedValue = 12.34;
      expect(parseNumber('12,34')).toBe(expectedValue);
    });
    it('should convert a decimal separated number (as string) to the exact same number', () => {
      const expectedValue = 23.45;
      expect(parseNumber('23.45')).toBe(expectedValue);
    });
    it('should convert a value with multiple decimal separators', () => {
      const expectedValue = 5678.91;
      expect(parseNumber('5,678.91')).toBe(expectedValue);
    });
  });

  describe('isValidNumber', () => {
    it('should fail on string with non numerical symbols', () => {
      expect(isValidNumber('a12,3m4')).toBeFalsy();
    });
    it('should fail on string with two dots', () => {
      expect(isValidNumber('2.3.45')).toBeFalsy();
    });
    it('should fail on string with two commas', () => {
      expect(isValidNumber('5,678,91')).toBeFalsy();
    });
    it('should allow to have a dot and a comma', () => {
      expect(isValidNumber('5,678.91')).toBeTruthy();
    });
  });

  describe('formatMoney', () => {
    it('should strip trailing zeros from number 12.0300', () => {
      const expectedValue = '12.03';
      expect(formatMoney('12.0300')).toBe(expectedValue);
    });
    it('should strip trailing zeros and a dot from number 12.00', () => {
      const expectedValue = '12';
      expect(formatMoney('12.00')).toBe(expectedValue);
    });
  });
});
