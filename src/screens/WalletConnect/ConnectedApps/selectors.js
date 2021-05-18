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

import { orderBy } from 'lodash';

// Hooks
import useWalletConnect from 'hooks/useWalletConnect';

// Utils
import { mapNotNil } from 'utils/array';

// Types
import { type Chain, chainFromChainId } from 'models/Chain';
import type { WalletConnectConnector } from 'models/WalletConnect';

export type AppItem = {|
  key: string,
  title: string,
  chain: Chain,
  iconUrl: ?string,
|};

export function useConnectedAppItems(): AppItem[] {
  const { activeConnectors } = useWalletConnect();
  return mapNotNil(activeConnectors, mapConnectorToItem);
}

function mapConnectorToItem(connector: WalletConnectConnector): ?AppItem {
  const key = `${connector.peerId}-${connector.chainId}`;
  const title = connector.peerMeta?.name;
  const chain = chainFromChainId[connector.chainId];
  if (!title || !chain) return null;

  const iconUrl = mapConnectorIconsToIcon(connector.peerMeta?.icons);

  return { key, title, chain, iconUrl };
}

/**
 * Heuristic way of picking the best icon.
 *
 * We try to pick PNG icons with highest pixel value by sorting them first by URL length (desc), then by name (desc).
 * Otherwise just pick whatever is there. See test file for sample cases.
 */
export function mapConnectorIconsToIcon(connectorIcons: ?string[]): ?string {
  if (!connectorIcons?.length) return null;
  if (connectorIcons?.length === 1) return connectorIcons[0];

  const pngUrls = connectorIcons.filter(url => url.endsWith('.png'));
  if (!pngUrls.length) return connectorIcons[1];

  const sortedPngUrls = orderBy(pngUrls, [(url) => url.length, (url) => url], ['desc', 'desc']);
  return sortedPngUrls[0];
}
