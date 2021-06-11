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
import { orderBy } from 'lodash';

// Services
import * as Prismic from 'services/prismic';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Types
import type { QueryResult } from 'utils/types/react-query';
import type { Chain } from 'models/Chain';
import type { WalletConnectCmsApp } from 'models/WalletConnectCms';

// Utils
import { chainFromChainId } from 'utils/chains';
import * as parse from 'utils/parse';

const TYPE_APPS = 'dapp_showcase';

/**
 * Fetch and parse WalletConnect apps from Prismic CMS as React Query.
 */
export function useFetchWalletConnectAppsQuery(): QueryResult<WalletConnectCmsApp[]> {
  return useQuery('WalletConnectApps', () => fetchWalletConnectAppsApiCall());
}

async function fetchWalletConnectAppsApiCall(): Promise<WalletConnectCmsApp[]> {
  const data = await Prismic.queryDocumentsByType<AppDto>(TYPE_APPS, { pageSize: 100 });
  const parsedData = parse.mapArrayOrEmpty(data.results, parseApp);
  return orderBy(parsedData, 'title');
}

/**
 * Type representing Prismic data for app. Contains only fields that are actually used.
 */
type AppDto = {
  name?: [?{ text?: string }],
  url?: { url?: string },
  category?: { id?: string },
  logo?: { url?: string },
  disabled?: boolean,
  chainagnostic?: boolean,
  supportedchains: ?ChainDto[],
};

type ChainDto = {
  chainid: ?string
};

function parseApp(item: ?Prismic.Document<AppDto>): ?WalletConnectCmsApp {
  if (!item) return null;

  const id = parse.stringOrNull(item.id);
  const title = parse.stringOrNull(item.data?.name?.[0]?.text);
  const url = parse.stringOrNull(item.data?.url?.url);
  const categoryId = parse.stringOrNull(item.data?.category?.id);
  const chains = parseChains(item);
  const disabled = parse.booleanOrNull(item.data?.disabled);
  if (!id || !title || !url || !categoryId || !chains.length || disabled) return null;

  const iconUrl = parse.stringOrNull(item.data?.logo?.url);
  return { id, title, url, categoryId, iconUrl, chains };
}

function parseChains(item: Prismic.Document<AppDto>): Chain[] {
  const isChainAgnostic = parse.booleanOrNull(item.data?.chainagnostic);
  if (isChainAgnostic) return Object.keys(CHAIN).map((key) => CHAIN[key]);

  return parse.mapArrayOrEmpty(item.data?.supportedchains, (data) => {
    const chainId = parse.numberOrNull(data.chainid);
    return chainId ? chainFromChainId[chainId] : null;
  });
}
