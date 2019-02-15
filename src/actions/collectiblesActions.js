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

import { UPDATE_COLLECTIBLES } from 'constants/collectiblesConstants';
import { saveDbAction } from './dbActions';

export const fetchCollectiblesAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { wallet: { data: wallet } } = getState();

    const collectibles = await api.fetchCollectibles(wallet.address);

    collectibles.assets.forEach((collectible) => {
      if (collectible.name === null) collectible.name = `${collectible.assetContract} ${collectible.id}`;
    });

    console.log('collectibles ---->', collectibles);

    if (collectibles && collectibles.assets && collectibles.categories) {
      dispatch(saveDbAction('collectibles', { collectibles }, true));
      dispatch({ type: UPDATE_COLLECTIBLES, payload: collectibles });
    }
  };
};
