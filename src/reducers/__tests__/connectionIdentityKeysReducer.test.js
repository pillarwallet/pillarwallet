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
import { UPDATE_CONNECTION_IDENTITY_KEYS } from 'constants/connectionIdentityKeysConstants';
import reducer from '../connectionIdentityKeysReducer';

const MOCK_CONNECTION_IDENTITY_KEYS = [{
  userId: '87ff9264-73c4-4aa6-b3c8-522f538290cz',
  targetUserId: '316143d5-3d3c-498b-b18c-801ef9e49c6g',
  sourceUserAccessKey: '5b55eeb2-0116-4d66-bc71-574d005a7dbd',
  targetUserAccessKey: '28dfaeaa-54d2-433d-8ef3-a187820796b4',
  sourceIdentityKey: '0x03965ab3eb3893871xb9ca66bde202822daba51dcaca19a3779cfa8ac6aadb4b3c',
  targetIdentityKey: '0x037a14a71e24021eyec5c5eeefc436bf052739fbff21ea6b729c664f8312d1409c',
  status: 'accepted',
},
{
  userId: '87dd9264-73c4-4az6-b3c8-522f538290cz',
  targetUserId: '316143d5-3d3c-508b-b18c-801ef9e49c6g',
  sourceUserAccessKey: '5b95eeb2-0116-4dg6-bc71-574d005a7dbd',
  targetUserAccessKey: '28dfaeaa-54d2-4g3d-8eg3-a187820796b4',
  sourceIdentityKey: '0x02965ab3eb3893871xb9ca66bde202822daba51dsaca19a3779cfa8ac6aadb4b3c',
  targetIdentityKey: '0x047a14a71e24021eyec5c5eeefc436bf052739fbff22ea6b729c664f8312d1409d',
  status: 'accepted',
},
];

describe('connectionIdentityKeys reducer', () => {
  it('should handle UPDATE_CONNECTION_IDENTITY_KEYS', () => {
    const updateAction = {
      type: UPDATE_CONNECTION_IDENTITY_KEYS,
      payload: MOCK_CONNECTION_IDENTITY_KEYS,
    };
    const expectedAssets = {
      data: MOCK_CONNECTION_IDENTITY_KEYS,
    };
    expect(reducer(undefined, updateAction)).toMatchObject(expectedAssets);
  });
});
