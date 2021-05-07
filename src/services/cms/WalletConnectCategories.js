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
import type { WalletConnectCategory } from 'models/WalletConnect';

// Utils
import * as parse from 'utils/parse';

const TYPE_CATEGORIES = 'dapp_showcase_categories';

export function useFetchWalletConnectCategoriesQuery(): QueryResult<WalletConnectCategory[]> {
  return useQuery('WalletConnectCategories', () => fetchWalletConnectCategoriesApiCall());
}

export async function fetchWalletConnectCategoriesApiCall(): Promise<WalletConnectCategory[]> {
  const data = await Prismic.queryDocumentsByType(TYPE_CATEGORIES, { pageSize: 100 });
  return parse.arrayOrEmpty(data.results, parseCategory);
}

function parseCategory(item: any): ?WalletConnectCategory {
  if (!item) return null;

  const id = parse.stringOrNull(item.id);
  const title = parse.stringOrNull(item.data?.name?.[0]?.text);
  if (!id || !title) return null;

  return { id, title };
}
