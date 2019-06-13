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

import type { ConnectionIdentityKey } from 'models/Connections';
import { useConnectionKeyPairs } from 'actions/connectionKeyPairActions';

export async function getIdentityKeyPairs(
  userId: string,
  connectionIdentityKeys: ConnectionIdentityKey[] = [],
  dispatch: Function,
) {
  const connIdKeyResult = connectionIdentityKeys.find((conIdKey) => {
    return conIdKey.targetUserId === userId;
  });

  let sourceIdentityKey;
  let targetIdentityKey;
  let connKeyPairReserved;
  if (connIdKeyResult) {
    sourceIdentityKey = connIdKeyResult.sourceIdentityKey; // eslint-disable-line prefer-destructuring
    targetIdentityKey = connIdKeyResult.targetIdentityKey; // eslint-disable-line prefer-destructuring
  } else {
    const connKeyPairs = await dispatch(useConnectionKeyPairs(1));
    if (connKeyPairs.length > 0) {
      sourceIdentityKey = connKeyPairs[0].A;
      targetIdentityKey = connKeyPairs[0].Ad;
      connKeyPairReserved = connKeyPairs;
    }
  }
  return {
    sourceIdentityKey,
    targetIdentityKey,
    connIdKeyResult,
    connKeyPairReserved,
  };
}
