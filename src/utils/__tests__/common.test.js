// @flow
import { delay, formatETHAmount } from '../common';

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
});
