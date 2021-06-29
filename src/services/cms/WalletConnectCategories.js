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

// Types
import type { QueryResult } from 'utils/types/react-query';
import type { WalletConnectCmsCategory } from 'models/WalletConnectCms';

// Utils
import * as parse from 'utils/parse';

const TYPE_CATEGORIES = 'dapp_showcase_categories';

/**
 * Fetch and parse WalletConnect categories from Prismic CMS as React Query.
 */
export function useFetchWalletConnectCategoriesQuery(): QueryResult<WalletConnectCmsCategory[]> {
  return useQuery('WalletConnectCategories', () => fetchWalletConnectCategoriesApiCall());
}

async function fetchWalletConnectCategoriesApiCall(): Promise<WalletConnectCmsCategory[]> {
  const data = await Prismic.queryDocumentsByType<CategoryDto>(TYPE_CATEGORIES, { pageSize: 100 });
  const parseData = parse.mapArrayOrEmpty(data.results, parseCategory);
  return orderBy(parseData, ['order']);
}

/**
 * Type representing Prismic data for category. Contains only fields that are actually used.
 */
type CategoryDto = {
  name?: [?{ text?: string }],
  order?: number,
};

function parseCategory(item: ?Prismic.Document<CategoryDto>): ?WalletConnectCmsCategory {
  if (!item) return null;

  const id = parse.stringOrNull(item.id);
  const title = parse.stringOrNull(item.data?.name?.[0]?.text);
  const order = parse.numberOrNull(item.data?.order) ?? Infinity;
  if (!id || !title) return null;

  return { id, title, order };
}
