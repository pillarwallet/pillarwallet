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
import axios from 'axios';
import { reportLog } from 'utils/common';


export const callSubgraph = (subgraphName: string, query: string) => {
  const url = `https://api.thegraph.com/subgraphs/name/${subgraphName}`; // eslint-disable-line i18next/no-literal-string, max-len
  return axios
    .post(url, { query }, { timeout: 5000 })
    .then(({ data: response }) => response.data)
    .catch((error) => {
      reportLog(`The Graph subgraph "${subgraphName}" API call failed`, { error, query }); // eslint-disable-line i18next/no-literal-string, max-len
      return null;
    });
};
