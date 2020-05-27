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

import type { Session } from 'models/WalletConnect';

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
