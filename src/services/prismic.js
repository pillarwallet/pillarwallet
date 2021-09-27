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

import * as Prismic from '@prismicio/client';
import { getEnv } from 'configs/envConfig';

export const DOCUMENT_TYPE = 'document.type';

const prismicClient = Prismic.client(getEnv().PRISMIC_ENDPOINT_URL, { accessToken: getEnv().PRISMIC_TOKEN });

export default prismicClient;

type QueryOptions = {|
  pageSize?: number,
|};

// Partial type def: https://prismic.io/docs/technologies/the-response-object-reactjs
export type Response<T> = {
  results: Document<T>[],
}

// Partial type def: https://prismic.io/docs/technologies/the-document-object-reactjs
export type Document<T> = {
  id: string,
  data: T,
}

export type DocumentData = {
  type: string,
  text: string,
}

export function queryDocumentsByType<T>(type: string, options?: QueryOptions): Promise<Response<T>> {
  return prismicClient.query(Prismic.Predicates.at(DOCUMENT_TYPE, type), options);
}

export async function queryDocumentsByID<T>(id: string): Promise<T> {
  const document = await prismicClient.getByID(id);
  return document.data;
}
