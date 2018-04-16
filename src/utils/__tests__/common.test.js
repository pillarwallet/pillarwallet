// @flow
import { delay } from '../common';

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
});
