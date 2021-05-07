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
import { type Chain, CHAIN, CHAIN_ID } from 'models/Chain';
import type { WalletConnectApp } from 'models/WalletConnect';


// Utils
import { mapNotNil } from 'utils/array';

export function useFetchWalletConnectAppsQuery(): QueryResult<WalletConnectApp[]> {
  return useQuery('WalletConnectApps', () => fetchWalletConnectCategoriesApiCall());
}

export function fetchWalletConnectCategoriesApiCall(): Promise<WalletConnectApp[]> {
  return mockResponse(() => parseResponseData(mockAppsData));
}

function mockResponse<T>(buildData: () => T, delay: number = 1000): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(buildData()), delay));
}

/** Parse root response data without crashing on data in invalid format. */
function parseResponseData(data: any): WalletConnectApp[] {
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

  console.log('CHAIN ID', chainIds, result);

  return result;
}

const mockAppsData = {
  page: 1,
  results_per_page: 20,
  results_size: 4,
  total_results_size: 4,
  total_pages: 1,
  next_page: null,
  prev_page: null,
  results: [
    {
      id: 'YJQIpxIAACMAizWF',
      uid: null,
      type: 'dapp_showcase',
      href:
        'https://pillar-app.cdn.prismic.io/api/v2/documents/search?ref=YJVHchIAACMAkNKb&q=%5B%5B%3Ad+%3D+at%28document.id%2C+%22YJQIpxIAACMAizWF%22%29+%5D%5D',
      tags: [],
      first_publication_date: '2021-05-06T15:25:20+0000',
      last_publication_date: '2021-05-07T13:58:04+0000',
      slugs: ['pool-together'],
      linked_documents: [],
      lang: 'en-gb',
      alternate_languages: [],
      data: {
        name: [
          {
            type: 'heading1',
            text: 'Pool Together',
            spans: [],
          },
        ],
        description: [],
        url: {
          link_type: 'Web',
          url: 'https://pooltogether.com',
        },
        logo: {
          dimensions: {
            width: 400,
            height: 400,
          },
          alt: null,
          copyright: null,
          url:
            'https://images.prismic.io/pillar-app/3c0d1f5a-58ea-402b-b001-04dcc508bafb_pticon.jpg?auto=compress,format',
        },
        headerimage: {},
        disabled: false,
        chainagnostic: true,
        supportedchains: [
          {
            chainname: null,
            chainid: null,
          },
        ],
        category: {
          id: 'YJM9HRIAACYAh6kJ',
          type: 'dapp_showcase_categories',
          tags: [],
          slug: 'investments',
          lang: 'en-gb',
          link_type: 'Document',
          isBroken: false,
        },
      },
    },
    {
      id: 'YJQJ4BIAACYAizsd',
      uid: null,
      type: 'dapp_showcase',
      href:
        'https://pillar-app.cdn.prismic.io/api/v2/documents/search?ref=YJVHchIAACMAkNKb&q=%5B%5B%3Ad+%3D+at%28document.id%2C+%22YJQJ4BIAACYAizsd%22%29+%5D%5D',
      tags: [],
      first_publication_date: '2021-05-06T15:25:20+0000',
      last_publication_date: '2021-05-07T13:56:59+0000',
      slugs: ['oasis'],
      linked_documents: [],
      lang: 'en-gb',
      alternate_languages: [],
      data: {
        name: [
          {
            type: 'heading1',
            text: 'Oasis',
            spans: [],
          },
        ],
        description: [],
        url: {
          link_type: 'Web',
          url: 'https://oasis.app',
        },
        logo: {
          dimensions: {
            width: 128,
            height: 128,
          },
          alt: null,
          copyright: null,
          url:
            'https://images.prismic.io/pillar-app/20b2e9d8-ef88-4530-af67-909bd7e4eb1e_logo+%282%29.png?auto=compress,format',
        },
        headerimage: {},
        disabled: false,
        chainagnostic: true,
        supportedchains: [
          {
            chainname: null,
            chainid: null,
          },
        ],
        category: {
          id: 'YJM9RxIAACUAh6nG',
          type: 'dapp_showcase_categories',
          tags: [],
          slug: 'exchanges',
          lang: 'en-gb',
          link_type: 'Document',
          isBroken: false,
        },
      },
    },
    {
      id: 'YJM2OBIAACQAh4qE',
      uid: null,
      type: 'dapp_showcase',
      href:
        'https://pillar-app.cdn.prismic.io/api/v2/documents/search?ref=YJVHchIAACMAkNKb&q=%5B%5B%3Ad+%3D+at%28document.id%2C+%22YJM2OBIAACQAh4qE%22%29+%5D%5D',
      tags: [],
      first_publication_date: '2021-05-06T15:25:20+0000',
      last_publication_date: '2021-05-07T13:57:52+0000',
      slugs: ['zerion'],
      linked_documents: [],
      lang: 'en-gb',
      alternate_languages: [],
      data: {
        name: [
          {
            type: 'heading1',
            text: 'Zerion',
            spans: [],
          },
        ],
        description: [
          {
            type: 'paragraph',
            text: 'A great dApp right here.',
            spans: [],
          },
        ],
        url: {
          link_type: 'Web',
          url: 'https://zerion.io',
        },
        logo: {
          dimensions: {
            width: 1200,
            height: 1200,
          },
          alt: null,
          copyright: null,
          url:
            'https://images.prismic.io/pillar-app/721c5e34-55ce-46c1-ad92-4efd3e64ff4c_1_MRQmNBtjBjLzDO11NoZODA.png?auto=compress,format',
        },
        headerimage: {},
        disabled: false,
        chainagnostic: false,
        supportedchains: [
          {
            chainname: 'mainnet',
            chainid: '1',
          },
          {
            chainname: 'Polygon',
            chainid: '137',
          },
        ],
        category: {
          id: 'YJM9tRIAACYAh6uu',
          type: 'dapp_showcase_categories',
          tags: [],
          slug: 'asset-management',
          lang: 'en-gb',
          link_type: 'Document',
          isBroken: false,
        },
      },
    },
    {
      id: 'YJQI-RIAACUAizcB',
      uid: null,
      type: 'dapp_showcase',
      href:
        'https://pillar-app.cdn.prismic.io/api/v2/documents/search?ref=YJVHchIAACMAkNKb&q=%5B%5B%3Ad+%3D+at%28document.id%2C+%22YJQI-RIAACUAizcB%22%29+%5D%5D',
      tags: [],
      first_publication_date: '2021-05-06T15:25:20+0000',
      last_publication_date: '2021-05-07T13:58:10+0000',
      slugs: ['sablier'],
      linked_documents: [],
      lang: 'en-gb',
      alternate_languages: [],
      data: {
        name: [
          {
            type: 'heading1',
            text: 'Sablier',
            spans: [],
          },
        ],
        description: [],
        url: {
          link_type: 'Web',
          url: 'https://sablier.finance',
        },
        logo: {
          dimensions: {
            width: 400,
            height: 400,
          },
          alt: null,
          copyright: null,
          url:
            'https://images.prismic.io/pillar-app/b1e7a70c-065d-47fb-9a9b-6b7fb481d192_sablier+logo.jpg?auto=compress,format',
        },
        headerimage: {},
        disabled: false,
        chainagnostic: true,
        supportedchains: [
          {
            chainname: null,
            chainid: null,
          },
        ],
        category: {
          id: 'YJM9tRIAACYAh6uu',
          type: 'dapp_showcase_categories',
          tags: [],
          slug: 'asset-management',
          lang: 'en-gb',
          link_type: 'Document',
          isBroken: false,
        },
      },
    },
  ],
  version: '726d2fa',
  license: 'All Rights Reserved',
};
