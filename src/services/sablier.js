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
    GNU General Public License for more details..

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/

import { getEnv } from 'configs/envConfig';

// services
import { callSubgraph } from 'services/theGraph';


export const fetchUserStreams = async (accountAddress: string) => {
  /* eslint-disable i18next/no-literal-string */
  const query = `
    {
      outgoingStreams: streams(where: {
        sender: "${accountAddress}",
      }) {
        id
        cancellation {
          id
          recipientBalance
          senderBalance
          timestamp
          txhash
        }
        deposit
        ratePerSecond
        recipient
        sender
        startTime
        stopTime
        timestamp
        token {
          id
          decimals
          name
          symbol
        }
        withdrawals {
          id
          amount
        }
        txs {
          id
          event
          timestamp
          stream {
            id
          }
        }
      }
      incomingStreams: streams(where: {
        recipient: "${accountAddress}",
      }) {
        id
        cancellation {
          id
          recipientBalance
          senderBalance
          timestamp
          txhash
        }
        deposit
        ratePerSecond
        recipient
        sender
        startTime
        stopTime
        timestamp
        token {
          id
          decimals
          name
          symbol
        }
        withdrawals {
          id
          amount
        }
        txs {
          id
          event
          timestamp
          stream {
            id
          }
        }
      }
    }
  `;
  /* eslint-enable i18next/no-literal-string */

  return callSubgraph(getEnv().SABLIER_SUBGRAPH_NAME, query);
};
