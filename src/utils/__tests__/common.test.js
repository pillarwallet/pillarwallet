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
import { BigNumber } from 'bignumber.js';

import {
  delay,
  formatAmount,
  decodeETHAddress,
  decodeBTCAddress,
  pipe,
  parseNumber,
  isValidNumber,
  formatMoney,
  uniqBy,
  formatUnits,
  formatFiat,
  extractJwtPayload,
  parseTokenAmount,
} from '../common';

describe('Common utils', () => {
  describe('delay', () => {
    it('should return a resolved delayed promise with specified timeout', () => {
      const timeout = 500;
      let value;
      delay(timeout).then(() => {
        value = true;
      }).catch(() => { });
      expect(value).toBeUndefined();
      setTimeout(() => {
        expect(value).not.toBeUndefined();
      }, timeout + 1);
    });
  });

  describe('formatAmount', () => {
    it('should format transaction amount to a readable one', () => {
      const expectedAmount = '0.000042';
      expect(formatAmount(0.0000420000001)).toBe(expectedAmount);
    });
  });

  describe('decodeETHAddress', () => {
    it('returns ETH address when string is an address', () => {
      const expectedAddress = '0xf74b153d202ab7368aca04efb71cb3c8c316b514';
      expect(decodeETHAddress('0xf74b153d202ab7368aca04efb71cb3c8c316b514')).toBe(expectedAddress);
    });

    it('returns ETH address from string provided', () => {
      const expectedAddress = '0xf74b153d202ab7368aca04efb71cb3c8c316b514';
      expect(decodeETHAddress('ethereum:0xf74b153d202ab7368aca04efb71cb3c8c316b514')).toBe(expectedAddress);
    });
  });

  describe('decodeBTCAddress', () => {
    it('returns address from string provided', () => {
      const expectedAddress = 'BITCOIN_ADDRESS';
      expect(decodeBTCAddress('bitcoin:BITCOIN_ADDRESS')).toBe(expectedAddress);
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

  describe('extractJwtPayload', () => {
    it('returns {} for invalid tokens', () => {
      const token = '-not-valid-';
      const expectedValue = {};
      expect(extractJwtPayload(token)).toEqual(expectedValue);
    });

    it('decodes jwt token', () => {
      const token = `ignored.${Buffer.from(JSON.stringify({ id: 4 })).toString('base64')}`;
      const expectedValue = { id: 4 };
      expect(extractJwtPayload(token)).toEqual(expectedValue);
    });
  });

  describe('parseNumber', () => {
    it('supports receiving a BigNumber', () => {
      const expectedValue = 3;
      expect(parseNumber(new BigNumber(3))).toBe(expectedValue);
    });
    it('supports receiving undefined', () => {
      const expectedValue = 0;
      expect(parseNumber(undefined)).toBe(expectedValue);
    });
    it('converts a comma separated number (as string) to a decimal separated number', () => {
      const expectedValue = 12.345;
      expect(parseNumber('12,345')).toBe(expectedValue);
    });
    it('converts a decimal separated number (as string) to the exact same number', () => {
      const expectedValue = 23.45;
      expect(parseNumber('23.45')).toBe(expectedValue);
    });
    it('converts a value with multiple decimal separators', () => {
      const expectedValue = 5678.91;
      expect(parseNumber('5,678.91')).toBe(expectedValue);
    });
  });

  describe('isValidNumber', () => {
    it('allows BigNumber', () => {
      expect(isValidNumber(new BigNumber(2))).toBeTruthy();
    });
    it('allows undefined', () => {
      expect(isValidNumber(undefined)).toBeTruthy();
    });
    it('fails on string with non numerical symbols', () => {
      expect(isValidNumber('a12,3m4')).toBeFalsy();
    });
    it('fails on string with two dots', () => {
      expect(isValidNumber('2.3.45')).toBeFalsy();
    });
    it('fails on string with two commas', () => {
      expect(isValidNumber('5,678,91')).toBeFalsy();
    });
    it('fails on string with ,. going side by side', () => {
      expect(isValidNumber('5,.678')).toBeFalsy();
    });
    it('fails on string with ., going side by side', () => {
      expect(isValidNumber('5.,678')).toBeFalsy();
    });
    it('allows to have a dot and a comma', () => {
      expect(isValidNumber('5,678.91')).toBeTruthy();
    });
  });

  describe('formatMoney', () => {
    it('should strip trailing zeros from number 12.0300', () => {
      const expectedValue = '12.03';
      expect(formatMoney('12.0300')).toBe(expectedValue);
    });
    it('should add trailing zeros to number 12.3', () => {
      const expectedValue = '12.30';
      expect(formatMoney('12.3', 2, 3, ',', '.', false)).toBe(expectedValue);
    });
    it('should strip trailing zeros and a dot from number 12.00', () => {
      const expectedValue = '12';
      expect(formatMoney('12.00')).toBe(expectedValue);
    });
  });

  describe('uniqBy', () => {
    it('returns uniq items by key', () => {
      const expected = [{ id: 1, name: 'Jon' }, { id: 2, name: 'Snow' }];
      const input = [{ id: 1, name: 'Jon' }, { id: 2, name: 'Snow' }, { id: 2, name: 'Snow' }];

      expect(uniqBy(input, 'id')).toEqual(expected);
    });
  });

  describe('formatUnits', () => {
    it('should format 0 correctly', () => {
      const result = formatUnits('0', 18);
      expect(result).toEqual('0.0');
    });
    it('should format 40000000000 correctly', () => {
      const result = formatUnits('40000000000', 18);
      expect(result).toEqual('0.00000004');
    });
    it('should format error input 0.0001 correctly', () => {
      const result = formatUnits('0.0001', 18);
      expect(result).toEqual('0.0');
    });
    it('should format 0xc420d9d8e4003a8000 correctly', () => {
      const result = formatUnits('0xc420d9d8e4003a8000', 18);
      expect(result).toEqual('3617.929');
    });
    it('should format error input undefined correctly', () => {
      const result = formatUnits(undefined, 18);
      expect(result).toEqual('0.0');
    });
    it('should format error input "" correctly', () => {
      const result = formatUnits('', 18);
      expect(result).toEqual('0.0');
    });
    it('should format 40000000 correctly with 0 decimals', () => {
      const result = formatUnits('40000000', 0);
      expect(result).toEqual('40000000.0');
    });
  });

  describe('formatFiat', () => {
    it('should add currency symbol to value string based on currency provided', () => {
      const expectedValue = '€ 14.30';
      expect(formatFiat('14.3', 'EUR')).toBe(expectedValue);
    });
    it('should add default (£) currency symbol to value string if no currency is provided', () => {
      const expectedValue = '£ 14.30';
      expect(formatFiat('14.3')).toBe(expectedValue);
    });
    it('should round value and show two decimals only', () => {
      const expectedValue = '£ 14.34';
      expect(formatFiat('14.336')).toBe(expectedValue);
    });
    it('should add trailing zeros to values missing second decimal', () => {
      const expectedValue = '£ 14.30';
      expect(formatFiat('14.3')).toBe(expectedValue);
    });
    it('should add trailing zeros to values missing decimals', () => {
      const expectedValue = '£ 14.00';
      expect(formatFiat('14')).toBe(expectedValue);
    });
    it('should show just 0 (without decimals) if value is less than 0', () => {
      const expectedValue = '£ 0';
      expect(formatFiat('0.00')).toBe(expectedValue);
    });
  });

  describe('parseTokenAmount', () => {
    it('should parse from 0.1 as 100000000000000000 with 18 decimals', () => {
      const expectedValue = 100000000000000000;
      expect(parseTokenAmount('0.1', 18)).toBe(expectedValue);
    });
    it('should parse from 100 as 100 with 0 decimals', () => {
      const expectedValue = 100;
      expect(parseTokenAmount('100', 0)).toBe(expectedValue);
    });
  });
});
