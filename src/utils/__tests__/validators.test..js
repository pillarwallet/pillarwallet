// @flow
import { validatePin } from '../validators';

describe('Validators', () => {
  describe('validatePin', () => {
    it('should validate the length of provided pin code', () => {
      const pin = '123456';
      const expectedErrorMessage = 'Invalid pin\'s length (should be 6 numbers)';
      expect(validatePin(pin)).toBeEmpty();
      expect(validatePin('1')).toBe(expectedErrorMessage);
    });

    it('should allow only digits', () => {
      const expectedErrorMessage = 'Pin could contain numbers only';
      expect(validatePin('1asd')).toBe(expectedErrorMessage);
    });
  });
});
