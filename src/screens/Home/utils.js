// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

// Selectors
import { useRootSelector } from 'selectors';
import { accountCollectiblesSelector } from 'selectors/collectibles';

// Utils
import { mapRecordValues, recordValues } from 'utils/object';

// Types
import type { ChainRecord } from 'models/Chain';

export function useAccountCollectibleCounts(): ChainRecord<number> {
  const collectiblesPerChain = useRootSelector(accountCollectiblesSelector);
  return mapRecordValues(collectiblesPerChain, (collectibles) => collectibles?.length ?? 0);
}

export function calculateTotalCollectibleCount(accountCollectibleCounts: ChainRecord<number>): number {
  const counts = recordValues(accountCollectibleCounts);
  return counts.reduce((total, count) => (count != null ? total + count : total), 0);
}
