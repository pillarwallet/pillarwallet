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
import { reportLog } from 'utils/common';
import httpRequest from 'utils/httpRequest';

export class GraphQueryError extends Error {
  subgraphName: string;
  query: string;
  responseError: Error;

  constructor(subgraphName: string, query: string, responseError: Error) {
    // eslint-disable-next-line i18next/no-literal-string
    super(`The Graph API call to subgraph "${subgraphName}" failed`);
    if (Error.captureStackTrace) Error.captureStackTrace(this, GraphQueryError);
    this.subgraphName = subgraphName;
    this.query = query;
    this.responseError = responseError;
  }
}

export const callSubgraph = (subgraphName: string, query: string) => {
  // eslint-disable-next-line i18next/no-literal-string
  const url = `https://api.thegraph.com/subgraphs/name/${subgraphName}`;

  return httpRequest.post(url, { query }, { retry: true })
    .then(({ data: response }) => response.data)
    .catch((error) => {
      reportLog(`The Graph subgraph "${subgraphName}" API call failed`, { error, query });
      throw new GraphQueryError(subgraphName, query, error);
    });
};
