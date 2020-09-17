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

type Addition = {
  id: string,
  after: string | null,
};

type Removal = {
  id: string,
};

type Changes = {
  add: Addition[];
  remove: Removal[];
}

export function hasChanges(changes: Changes) {
  return changes.add.length > 0 || changes.remove.length > 0;
}

// Assumptions about possible modifications:
// - ids are unique: once an item is removed, its id will never appear again
// - there are no changes in order
//
// In addition:
// - 'after' set to null means the item appeared at the beginning of the list.
// - the 'after' pointers are set to the previous item in the new array, even
//   if that item is also newly inserted. The order of the .add array matches
//   matches 'next'.
export function getChanges(prev: string[], next: string[]): Changes {
  const add = [];
  next.forEach((id, i) => {
    if (!prev.includes(id)) {
      add.push({ id, after: next[i - 1] ?? null });
    }
  });

  const remove = prev.filter(id => !next.includes(id)).map(id => ({ id }));

  return { add, remove };
}

export function applyAdditions(array: string[], changes: Addition[]): string[] {
  if (changes.length === 0) return array;

  const next = [...array];
  changes.forEach(change => {
    // in case of change.after == null:
    // insertAt = (-1) + 1 = 0
    // which fits with 'null' meaning 'at the beginning'
    const insertAt = next.indexOf(change.after) + 1;
    next.splice(insertAt, 0, change.id);
  });

  return next;
}
