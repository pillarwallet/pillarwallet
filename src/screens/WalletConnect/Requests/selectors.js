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

// Hooks
import useWalletConnect from 'hooks/useWalletConnect';

// Utils
import { mapNotNil } from 'utils/array';
import { getWalletConnectCallRequestType, parsePeerName } from 'utils/walletConnect';

// Types
import type { WalletConnectCallRequestType, WalletConnectCallRequest } from 'models/WalletConnect';

export type RequestItem = {|
  id: string,
  title: string,
  iconUrl: ?string,
  type: WalletConnectCallRequestType,
  callRequest: WalletConnectCallRequest,
|};

export function useRequestItems(): RequestItem[] {
  const { callRequests } = useWalletConnect();

  return mapNotNil(callRequests, (request) => {
    const id = `${request.peerId}-${request.callId}`;
    const title = parsePeerName(request.name);
    const type = getWalletConnectCallRequestType(request);
    const iconUrl = request.icon;
    return { id, title, type, iconUrl, callRequest: request };
  });
}
