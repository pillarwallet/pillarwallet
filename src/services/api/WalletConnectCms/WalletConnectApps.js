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
/* eslint-disable i18next/no-literal-string */

import { useQuery } from 'react-query';

// Services
import * as Prismic from 'services/prismic';

// Types
import type { QueryResult } from 'utils/types/react-query';
import { type Chain, CHAIN, CHAIN_ID } from 'models/Chain';
import type { WalletConnectApp } from 'models/WalletConnect';


// Utils
import { mapNotNil } from 'utils/array';

const APPS = 'dapp_showcase';

export function useFetchWalletConnectAppsQuery(): QueryResult<WalletConnectApp[]> {
  return useQuery('WalletConnectApps', () => fetchWalletConnectCategoriesApiCall());
}

export async function fetchWalletConnectCategoriesApiCall(): Promise<WalletConnectApp[]> {
  const data = await Prismic.queryDocumentsByType(APPS);
  return parseResponseData(data);
}

/** Parse root response data without crashing on data in invalid format. */
function parseResponseData(data: Prismic.Response<any>): WalletConnectApp[] {
  const items = data.results;
  if (!items || !Array.isArray(items)) return [];

  return mapNotNil(items, (item) => parseApp(item));
}

function parseApp(item: ?any): ?WalletConnectApp {
  if (!item) return null;

  const { id } = item;
  const title = item.data?.name?.[0]?.text;
  const categoryId = item.data?.category?.id;
  const iconUrl = item.data?.logo?.url;
  const chains = parseChains(item.data?.chainagnostic, item.data?.supportedchains);
  const disabled = item.data?.disabled;
  if (!id || !title || !categoryId || !chains.length || disabled) return null;

  return { id, title, categoryId, iconUrl, chains };
}

function parseChains(chainAgnostic: boolean, supportedChains: any): Chain[] {
  if (chainAgnostic) return Object.keys(CHAIN).map((key) => CHAIN[key]);
  if (!Array.isArray(supportedChains)) return [];

  const chainIds = supportedChains.map(chain => chain.chainid);

  const result = [];
  if (chainIds.includes(CHAIN_ID.POLYGON)) result.push(CHAIN.POLYGON);
  if (chainIds.includes(CHAIN_ID.BINANCE)) result.push(CHAIN.BINANCE);
  if (chainIds.includes(CHAIN_ID.XDAI)) result.push(CHAIN.XDAI);
  if (chainIds.includes(CHAIN_ID.ETHEREUM)) result.push(CHAIN.ETHEREUM);

  return result;
}
