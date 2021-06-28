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

// Components
import {
  renderHTMLfromPrismic,
} from 'components/Modals/PrismicDocumentModal/RenderHTMLfromPrismic';

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

export function queryDocumentsByType<T>(type: string, options?: QueryOptions): Response<T> {
  return prismicClient.query(Prismic.Predicates.at(DOCUMENT_TYPE, type), options);
}

export async function queryDocumentsByID(id: string): Promise<Object> {
  const fetchPrismicDocumentResponse = await prismicClient.getByID(id);
  const document = fetchPrismicDocumentResponse.data;
  const prismicHTMLContent = [];
  document?.title?.map((documentData) => {
    if (!documentData.text) return null;
    return prismicHTMLContent.push(renderHTMLfromPrismic(documentData.type, documentData.text));
  });
  document?.subtitle?.map((documentData) => {
    if (!documentData.text) return null;
    return prismicHTMLContent.push(renderHTMLfromPrismic(documentData.type, documentData.text));
  });
  document?.content?.map((documentData) => {
    if (!documentData.text) return null;
    return prismicHTMLContent.push(renderHTMLfromPrismic(documentData.type, documentData.text));
  });
  const prismicConvertedHTMLData = prismicHTMLContent.join('');
  return prismicConvertedHTMLData;
}
