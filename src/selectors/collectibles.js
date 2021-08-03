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
import { mapValues } from 'lodash';

// Selectors
import { activeAccountIdSelector } from 'selectors';

// types
import type { RootReducerState, Selector } from 'reducers/rootReducer';
import type { ChainRecord } from 'models/Chain';
import type {
  Collectible,
  CollectiblesHistoryStore,
  CollectiblesStore,
  CollectibleTransaction,
} from 'models/Collectible';


export const collectiblesPerAccountSelector = ({ collectibles }: RootReducerState): CollectiblesStore =>
  collectibles.data;

export const accountCollectiblesSelector: Selector<ChainRecord<Collectible[]>> = createSelector(
  collectiblesPerAccountSelector,
  activeAccountIdSelector,
  (collectiblesPerAccount: CollectiblesStore, activeAccountId: ?string): ChainRecord<Collectible[]> => {
    if (!activeAccountId) return { ethereum: [] };
    return collectiblesPerAccount[activeAccountId] || { ethereum: [] };
  },
);

export const collectiblesHistorySelector = ({ collectibles }: RootReducerState) => collectibles.transactionHistory;

export const accountCollectiblesHistorySelector = createSelector(
  collectiblesHistorySelector,
  activeAccountIdSelector,
  (history: CollectiblesHistoryStore, activeAccountId: ?string): ChainRecord<CollectibleTransaction[]> => {
    if (!activeAccountId) return { ethereum: [] };
    return history[activeAccountId] ?? { ethereum: [] };
  },
);

export const activeAccountMappedCollectiblesSelector = createSelector(
  accountCollectiblesSelector,
  (collectiblesPerChain: ChainRecord<Collectible[]>) => mapValues(
    collectiblesPerChain,
    (collectibles) => (collectibles ?? []).map((collectible) => {
      const { icon, id } = collectible;
      return {
        imageUrl: icon,
        value: id,
        tokenId: id,
        ...collectible,
      };
    }),
  ),
);
