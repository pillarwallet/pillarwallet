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

// Types
import type { ChainRecord } from 'models/Chain';

// Selectors
import { useRootSelector } from 'selectors';
import { accountCollectiblesSelector } from 'selectors/collectibles';
import { mapRecordValues } from 'utils/object';

export type CollectibleItem = {|
  key: string,
  id: string,
  title: string,
  description: ?string,
  iconUrl: ?string,
  imageUrl: ?string,
  contractAddress: string,
  tokenId: string,
  isLegacy: boolean,
|};

export function useCollectibleAssets(): ChainRecord<CollectibleItem[]> {
  const collectiblesPerChain = useRootSelector(accountCollectiblesSelector);

  return mapRecordValues(
    collectiblesPerChain,
    (collectibles) => (collectibles ?? []).map(({
      id,
      contractAddress,
      description,
      icon: iconUrl,
      image: imageUrl,
      name: title,
      isLegacy,
    }) => ({
      key: `${contractAddress}-${id}`,
      id,
      title,
      description,
      iconUrl,
      imageUrl,
      contractAddress,
      tokenId: id,
      isLegacy,
    })),
  );
}
