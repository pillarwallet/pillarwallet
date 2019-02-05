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
import { UPDATE_ASSET, UPDATE_ASSETS_STATE, FETCHING, ETH } from 'constants/assetsConstants';
import reducer from '../assetsReducer';

describe('Assets reducer', () => {
  it('should handle UPDATE_ASSET', () => {
    const updateAction = { type: UPDATE_ASSET, payload: { symbol: ETH, balance: 5 } };
    const expectedAssets = {
      data: {
        [ETH]: {
          symbol: ETH,
          balance: 5,
        },
      },
    };
    expect(reducer(undefined, updateAction)).toMatchObject(expectedAssets);
  });

  it('should handle UPDATE_ASSET_STATE', () => {
    const updateAction = { type: UPDATE_ASSETS_STATE, payload: FETCHING };
    expect(reducer(undefined, updateAction)).toMatchObject({ assetsState: FETCHING });
  });
});
