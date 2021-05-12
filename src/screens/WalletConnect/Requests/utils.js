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

import t from 'translations/translate';

// Constants
import { REQUEST_TYPE } from 'constants/walletConnectConstants';

// Types
import type { WalletConnectRequestType, WalletConnectCallRequest } from 'models/WalletConnect';

export type RequestViewModel = {|
  title: string,
  iconUrl: string,
  type: WalletConnectRequestType,
  model: ?WalletConnectCallRequest,
|};

// TODO: replace with real WC data
export function useRequests(): RequestViewModel[] {
  return [
    {
      title: 'Zerion',
      type: REQUEST_TYPE.TRANSACTION,
      iconUrl:
        'https://images.prismic.io/pillar-app/3c0d1f5a-58ea-402b-b001-04dcc508bafb_pticon.jpg?auto=compress,format',
      model: null,
    },
    {
      title: 'Zerion',
      type: REQUEST_TYPE.MESSAGE,
      iconUrl:
        'https://images.prismic.io/pillar-app/721c5e34-55ce-46c1-ad92-4efd3e64ff4c_1_MRQmNBtjBjLzDO11NoZODA.png?auto=compress,format',
      model: null,
    },
  ];
}

export function formatRequestType(type: WalletConnectRequestType) {
  switch (type) {
    case REQUEST_TYPE.MESSAGE:
      return t('walletConnect.requests.messageRequest');
    case REQUEST_TYPE.TRANSACTION:
      return t('walletConnect.requests.transactionRequest');
    default:
      return null;
  }
}
