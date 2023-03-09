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

// Utils
import { nativeAssetPerChain } from 'utils/chains';
import { reportErrorLog } from 'utils/common';

export const isChainIcon = (nameOrUrl: any): boolean => {
  if (!nameOrUrl) {
    reportErrorLog('isChainIcon: Icon url or name not found', { nameOrUrl });
    return false;
  }

  const chainInfo = nativeAssetPerChain[nameOrUrl];
  if (!chainInfo) return false;

  return true;
};
