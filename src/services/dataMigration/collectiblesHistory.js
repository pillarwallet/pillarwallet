// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

// actions
import { saveDbAction } from 'actions/dbActions';

// utils
import { transactionStoreHasOldStructure } from 'utils/history';

// types
import type { Dispatch } from 'reducers/rootReducer';


export default function (storageData: Object, dispatch: Dispatch) {
  const collectiblesHistory = storageData?.collectiblesHistory?.collectiblesHistory ?? {}; // not a mistype

  // check for migration to history per account per chain, tx were ethereum only per migration moment
  if (transactionStoreHasOldStructure(collectiblesHistory)) {
    const updatedCollectiblesHistory = Object.keys(collectiblesHistory).reduce((
      updated,
      accountId,
    ) => ({
      ...updated,
      [accountId]: { ethereum: collectiblesHistory[accountId] ?? [] },
    }), {});

    dispatch(saveDbAction('collectiblesHistory', { collectiblesHistory: updatedCollectiblesHistory }, true));

    return updatedCollectiblesHistory;
  }

  return collectiblesHistory;
}
