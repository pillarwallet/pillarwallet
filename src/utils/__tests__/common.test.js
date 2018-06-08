// @flow
import { delay, formatETHAmount, decodeETHAddress, pipe, parseNumber } from '../common';

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
    it('should convert a comma seperated number (as string) to a decimal seperated number', () => {
      const expectedValue = 12.34;
      expect(parseNumber('12,34')).toBe(expectedValue);
    });
    it('should convert a decimal seperated number (as string) to the exact same number', () => {
      const expectedValue = 23.45;
      expect(parseNumber('23.45')).toBe(expectedValue);
    });
    it('should convert a value with multiple decimal seperators', () => {
      const expectedValue = 5678.91;
      expect(parseNumber('5,678.91')).toBe(expectedValue);
    });
  });
});
