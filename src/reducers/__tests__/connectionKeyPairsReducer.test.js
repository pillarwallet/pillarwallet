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
import { UPDATE_CONNECTION_KEY_PAIRS } from 'constants/connectionKeyPairsConstants';
import reducer from '../connectionKeyPairsReducer';

const MOCK_PREKEY_PAYLOAD = [{
  A: '0x0123456789012345678901234567890123456789012345678901234567890123',
  Ad: '0x0123456789012345678901234567890123456789012345678901234567890124',
  connIndex: 3,
},
{
  A: '0x0123456789012345678901234567890123456789012345678901234567890126',
  Ad: '0x0123456789012345678901234567890123456789012345678901234567890127',
  connIndex: 4,
},
];

describe('connectionKeyPairs reducer', () => {
  it('should handle UPDATE_CONNECTION_KEY_PAIRS', () => {
    const updateAction = {
      type: UPDATE_CONNECTION_KEY_PAIRS,
      payload: MOCK_PREKEY_PAYLOAD,
    };
    const expectedAssets = {
      data: MOCK_PREKEY_PAYLOAD,
      lastConnectionKeyIndex: 4,
    };
    expect(reducer(undefined, updateAction)).toMatchObject(expectedAssets);
  });
});
