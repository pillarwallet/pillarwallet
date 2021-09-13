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

// constants
import { SET_SUPPORTED_ASSETS } from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';

// reducers
import reducer from 'reducers/assetsReducer';

// types
import type { Asset } from 'models/Asset';


describe('Assets reducer', () => {
  it('sorts supported assets', () => {
    const newAsset = (symbol: string): Asset => ({
      chain: CHAIN.ETHEREUM,
      symbol,
      name: symbol,
      address: '0x0000',
      iconUrl: '',
      decimals: 10,
    });

    const updateAction = {
      type: SET_SUPPORTED_ASSETS,
      payload: {
        ethereum: [
          newAsset('BCA'),
          newAsset('CDA'),
          newAsset('BBA'),
          newAsset('ABC'),
        ],
      },
    };

    const state = reducer(undefined, updateAction);

    const ethereumSupportedAssetsInState = state.supportedAssets?.ethereum ?? [];

    expect(ethereumSupportedAssetsInState.map(({ symbol }) => symbol)).toEqual([
      'ABC',
      'BBA',
      'BCA',
      'CDA',
    ]);
  });
});
