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
  getChanges,
  hasChanges,
  applyAdditions,
} from '../changes';

describe('Toast list change utility functions', () => {
  describe('getChanges', () => {
    it('finds additions to list', () => {
      const prev = ['a', 'b', 'c'];
      const next = ['x', 'a', 'b', 'y', 'c'];

      const expected = {
        add: [{
          id: 'x',
          after: null,
        }, {
          id: 'y',
          after: 'b',
        }],
        remove: [],
      };

      expect(getChanges(prev, next)).toStrictEqual(expected);
    });

    it('finds multiple insertions in a row', () => {
      const prev = ['a', 'b', 'c'];
      const next = ['a', 'b', 'x', 'y', 'c'];

      const expected = {
        add: [{
          id: 'x',
          after: 'b',
        }, {
          id: 'y',
          after: 'x',
        }],
        remove: [],
      };

      expect(getChanges(prev, next)).toStrictEqual(expected);
    });

    it('finds items removed from the list', () => {
      const prev = ['x', 'a', 'b', 'y', 'c'];
      const next = ['a', 'b', 'c'];

      const expected = {
        add: [],
        remove: [{ id: 'x' }, { id: 'y' }],
      };

      expect(getChanges(prev, next)).toStrictEqual(expected);
    });

    it('sets .after property to the previous item in new array', () => {
      const prev = ['a', 'b', 'c'];
      const next = ['a', 'x', 'c'];

      const expected = {
        add: [{ id: 'x', after: 'a' }],
        remove: [{ id: 'b' }],
      };

      expect(getChanges(prev, next)).toStrictEqual(expected);
    });
  });

  describe('hasChanges', () => {
    it('checks both additions and removals', () => {
      expect(hasChanges({
        add: [],
        remove: [],
      })).toEqual(false);

      expect(hasChanges({
        add: [{ id: 'x', after: null }],
        remove: [],
      })).toEqual(true);

      expect(hasChanges({
        add: [],
        remove: [{ id: 'x' }],
      })).toEqual(true);
    });
  });

  describe('applyAdditions', () => {
    it('inserts elements at the beginnig', () => {
      const prev = ['a', 'b'];
      const add = [{ id: 'x', after: null }];
      expect(applyAdditions(prev, add)).toStrictEqual(['x', 'a', 'b']);
    });

    it('inserts elements in the middle', () => {
      const prev = ['a', 'b'];
      const add = [{ id: 'x', after: 'a' }];
      expect(applyAdditions(prev, add)).toStrictEqual(['a', 'x', 'b']);
    });

    it('inserts multiple elements', () => {
      const prev = ['a', 'b'];
      const add = [
        { id: 'x', after: 'a' },
        { id: 'y', after: 'x' },
        { id: 'z', after: 'x' },
      ];

      expect(applyAdditions(prev, add)).toStrictEqual(['a', 'x', 'z', 'y', 'b']);
    });
  });
});
