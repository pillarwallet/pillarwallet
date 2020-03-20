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


export type ConnectionIdentityKeyMap = {
  walletId: string,
  identityKeys: ConnectionIdentityKeyPair[],
}

export type ConnectionUpdateIdentityKeys = {
  walletId: string,
  connections: [{
      sourceUserAccessKey: string,
      targetUserAccessKey: string,
      sourceIdentityKey: string,
      targetIdentityKey: string,
      targetUserId: string,
  }],
}

export type ConnectionPatchIdentityKeys = {
  walletId: string,
  connections: [{
    sourceUserAccessKey: ?string,
    targetUserAccessKey: ?string,
    sourceIdentityKey: string,
    targetIdentityKey: string,
    targetUserId: string,
  }],
}

export type ConnectionIdentityKey = {
  userId: string,
  targetUserId: string,
  sourceUserAccessKey?: ?string,
  targetUserAccessKey?: ?string,
  sourceIdentityKey: string,
  targetIdentityKey: string,
  status: string,
  createdAt: string,
  updatedAt: string,
  targetUserInfo: {
    userId: string,
    username: string,
    profileImage?: ?string,
    profileLargeImage?: ?string,
    ethAddress: string
  }
}
