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

// Types
import type { QueryResult } from 'utils/types/react-query';
import type { WalletConnectCategory } from 'models/WalletConnect';

// Utils
import { mapNotNil } from 'utils/array';

export function useFetchWalletConnectCategoriesQuery(): QueryResult<WalletConnectCategory[]> {
  return useQuery('WalletConnectCategories', () => fetchWalletConnectCategoriesApiCall());
}

export function fetchWalletConnectCategoriesApiCall(): Promise<WalletConnectCategory[]> {
  return mockResponse(() => parseResponseData(mockCategoriesData));
}

function mockResponse<T>(buildData: () => T, delay: number = 1000): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(buildData()), delay));
}

function parseResponseData(data: any): WalletConnectCategory[] {
  const items = data.results;
  if (!items || !Array.isArray(items)) return [];

  return mapNotNil(items, (item) => parseCategory(item));
}

function parseCategory(item: any): ?WalletConnectCategory {
  if (!item) return null;

  const { id } = item;
  const title = item.data?.name?.[0]?.text;
  if (!id || !title) return null;

  return { id, title };
}

const mockCategoriesData = {
  page: 1,
  results_per_page: 20,
  results_size: 3,
  total_results_size: 3,
  total_pages: 1,
  next_page: null,
  prev_page: null,
  results: [
    {
      id: 'YJM9RxIAACUAh6nG',
      uid: null,
      type: 'dapp_showcase_categories',
      href:
        'https://pillar-app.cdn.prismic.io/api/v2/documents/search?ref=YJQKYBIAACMAiz1x&q=%5B%5B%3Ad+%3D+at%28document.id%2C+%22YJM9RxIAACUAh6nG%22%29+%5D%5D',
      tags: [],
      first_publication_date: '2021-05-06T15:25:20+0000',
      last_publication_date: '2021-05-06T15:25:20+0000',
      slugs: ['exchanges'],
      linked_documents: [],
      lang: 'en-gb',
      alternate_languages: [],
      data: {
        name: [
          {
            type: 'heading1',
            text: 'Exchanges',
            spans: [],
          },
        ],
      },
    },
    {
      id: 'YJM9tRIAACYAh6uu',
      uid: null,
      type: 'dapp_showcase_categories',
      href:
        'https://pillar-app.cdn.prismic.io/api/v2/documents/search?ref=YJQKYBIAACMAiz1x&q=%5B%5B%3Ad+%3D+at%28document.id%2C+%22YJM9tRIAACYAh6uu%22%29+%5D%5D',
      tags: [],
      first_publication_date: '2021-05-06T15:25:20+0000',
      last_publication_date: '2021-05-06T15:25:20+0000',
      slugs: ['asset-management'],
      linked_documents: [],
      lang: 'en-gb',
      alternate_languages: [],
      data: {
        name: [
          {
            type: 'heading1',
            text: 'Asset Management',
            spans: [],
          },
        ],
      },
    },
    {
      id: 'YJM9HRIAACYAh6kJ',
      uid: null,
      type: 'dapp_showcase_categories',
      href:
        'https://pillar-app.cdn.prismic.io/api/v2/documents/search?ref=YJQKYBIAACMAiz1x&q=%5B%5B%3Ad+%3D+at%28document.id%2C+%22YJM9HRIAACYAh6kJ%22%29+%5D%5D',
      tags: [],
      first_publication_date: '2021-05-06T15:25:20+0000',
      last_publication_date: '2021-05-06T15:25:20+0000',
      slugs: ['investments'],
      linked_documents: [],
      lang: 'en-gb',
      alternate_languages: [],
      data: {
        name: [
          {
            type: 'heading1',
            text: 'Investments',
            spans: [],
          },
        ],
      },
    },
  ],
  version: '726d2fa',
  license: 'All Rights Reserved',
};
