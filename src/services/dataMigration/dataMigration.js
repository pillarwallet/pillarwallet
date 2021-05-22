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

import loadAndMigrateAppSettings from './appSettings';
import loadAndMigrateAccounts from './accounts';
import loadAndMigrateHistory from './history';
import loadAndMigrateCollectibles from './collectibles';
import loadAndMigrateCollectiblesHistory from './collectiblesHistory';
import loadAndMigrateAssets from './assets';
import loadAndMigrateExchangeAllowances from './exchangeAllowances';

export async function migrate(
  collection: string,
  storageData: Object,
  dispatch: Function,
  getState: Function,
  key: string = collection,
) {
  let data;

  /* eslint-disable i18next/no-literal-string */
  switch (collection) {
    case 'app_settings':
      data = await loadAndMigrateAppSettings(storageData, dispatch);
      break;

    case 'accounts':
      data = await loadAndMigrateAccounts(storageData, dispatch);
      break;

    case 'assets':
      data = loadAndMigrateAssets(storageData);
      break;

    case 'history':
      await loadAndMigrateHistory(storageData, dispatch, getState);
      return storageData;

    case 'collectibles':
      data = loadAndMigrateCollectibles(storageData);
      break;

    case 'collectiblesHistory':
      data = loadAndMigrateCollectiblesHistory(storageData);
      break;

    case 'exchangeAllowances':
      data = loadAndMigrateExchangeAllowances(storageData);
      break;

    default: break;
  }
  /* eslint-enable i18next/no-literal-string */

  return {
    ...storageData,
    [collection]: { [key]: data },
  };
}
