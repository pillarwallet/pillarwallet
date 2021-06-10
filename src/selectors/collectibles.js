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

import { createSelector } from 'reselect';

// types
import type { ChainRecord } from 'models/Chain';
import type { CollectibleTransaction } from 'models/Collectible';

// selectors
import { collectiblesSelector, collectiblesHistorySelector, activeAccountIdSelector } from './selectors';


export const accountCollectiblesSelector = createSelector(
  collectiblesSelector,
  activeAccountIdSelector,
  (collectibles, activeAccountId) => {
    if (!activeAccountId) return [];
    return collectibles[activeAccountId] || [];
  },
);

export const accountCollectiblesHistorySelector = createSelector(
  collectiblesHistorySelector,
  activeAccountIdSelector,
  (history, activeAccountId): ChainRecord<CollectibleTransaction[]> => {
    if (!activeAccountId) return { ethereum: [] };
    return history[activeAccountId];
  },
);

export const activeAccountMappedCollectiblesSelector = createSelector(accountCollectiblesSelector, (collectibles) => {
  return collectibles.map((collectible) => {
    const { icon, id } = collectible;
    return {
      imageUrl: icon,
      value: id,
      tokenId: id,
      ...collectible,
    };
  });
});
