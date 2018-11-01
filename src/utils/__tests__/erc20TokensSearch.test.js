// @flow
import erc20TokensSearch from 'utils/erc20TokensSearch';

describe('ERC20TokensSearch utils', () => {
  describe('includes', () => {
    const { includes } = erc20TokensSearch;

    describe('when value and/or searchValue are/is NOT empty line', () => {
      it('should return false', () => {
        expect(includes('', '')).toBe(false);
        expect(includes('Lorem', '')).toBe(false);
        expect(includes('', 'Lorem')).toBe(false);
      });
    });

    describe('when value and searchValue is set', () => {
      describe('and search value is in value (case insensitive)', () => {
        it('should return true', () => {
          const value = 'Lorem ipsum dolor sit amet';
          expect(includes(value, 'Lorem')).toBe(true);
          expect(includes(value, 'SIT')).toBe(true);
        });
      });

      describe('and search value is NOT in value (case insensitive)', () => {
        it('should ', () => {
          expect(includes('Lorem ipsum dolor sit amet', 'orci')).toBe(false);
        });
      });
    });
  });

  describe('findList', () => {
    const { findList } = erc20TokensSearch;

    describe('when search value is empty string', () => {
      it('should return an empty array', () => {
        expect(findList('')).toEqual([]);
      });
    });

    describe('when search value is set', () => {
      describe('and the token can NOT be found', () => {
        it('should return the empty array', () => {
          expect(findList('lorem')).toEqual([]);
        });
      });

      describe('and the token(s) can be found by name or symbol', () => {
        it('should return the array with token(s)', () => {
          expect(findList('PLR').length).toBe(1);
          expect(findList('Pillar').length).toBe(1);
        });
      });

      describe('and more then 20 token(s) can be found by address, name or symbol', () => {
        it('should return the array with 20 elements', () => {
          expect(findList('a').length).toBe(20);
        });

        describe('and the size is set', () => {
          it('should return the array with N elements', () => {
            const size = 3;
            expect(findList('a', size).length).toBe(size);
          });
        });
      });
    });
  });
});
