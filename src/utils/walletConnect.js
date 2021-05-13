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

import t from 'translations/translate';

// Constants
import {
  ETH_SEND_TX,
  ETH_SIGN,
  ETH_SIGN_TX,
  ETH_SIGN_TYPED_DATA,
  PERSONAL_SIGN,
  REQUEST_TYPE,
} from 'constants/walletConnectConstants';

// Types
import type { Session, WalletConnectCallRequest, WalletConnectRequestType } from 'models/WalletConnect';


// urls of dapps that don't support smart accounts
// or that we don't want to support for any reason
const UNSUPPORTED_APPS_URLS: string[] = [
  'https://app.mooni.tech',
  'https://localcryptos.com',
  'https://www.binance.org',
];

export const shouldClearWCSessions = (sessions: Session[], keyWalletAddress: string) => {
  if (!sessions[0]) return false;
  return sessions[0].accounts.includes(keyWalletAddress);
};


export const shouldAllowSession = (url: string) => {
  return !UNSUPPORTED_APPS_URLS.includes(url);
};

export const getWalletConnectCallRequestType = (callRequest: WalletConnectCallRequest): string => {
  switch (callRequest?.method) {
    case ETH_SEND_TX:
    case ETH_SIGN_TX:
      return REQUEST_TYPE.TRANSACTION;
    case ETH_SIGN:
    case ETH_SIGN_TYPED_DATA:
    case PERSONAL_SIGN:
      return REQUEST_TYPE.MESSAGE;
    default:
      return REQUEST_TYPE.UNSUPPORTED;
  }
};

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
