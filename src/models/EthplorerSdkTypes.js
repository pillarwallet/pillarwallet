// @flow
/* eslint-disable */
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

export type TokenInfo = {
 address: string,             // token address,
 totalSupply: number,         // total token supply,
 name: string,                // token name,
 symbol: string,              // token symbol,
 decimals: number,            // number of significant digits,
 price: {                     // token price (false, if not available)
   rate: number,              // current rate
   currency: string,          // token price currency (USD)
   diff: number,              // 24 hours rate difference (in percent)
   diff7d: number,            // 7 days rate difference (in percent)
   diff30d: number,           // 30 days rate difference (in percent)
   marketCapUsd: number,      // market cap (USD)
   availableSupply: number,   // available supply
   volume24h: number,         // 24 hours volume
   ts: number,                // last rate update timestamp
 },
 owner: string,               // token owner address,
 countOps: number,            // total count of token operations
 totalIn: number,             // total amount of incoming tokens
 totalOut: number,            // total amount of outgoing tokens
 transfersCount: number,      // total number of token operations
 ethTransfersCount: number,   // total number of ethereum operations, optional
 holdersCount: number,        // total numnber of token holders
 issuancesCount: number,      // total count of token issuances
 image: string,               // token image url, optional
 description: string,         // token description, optional
 website: string,             // token website url, optional
 lastUpdated: number,         // last update timestamp
};

export type GetTokenHistoryParams = {
  type?: string,       // show operations of specified type only (transfer, approve, issuance, mint, burn, etc)
  limit?: number,      // maximum number of operations [1 - 1000, default = 10]
  timestamp?: number,  // starting offset for operations [unix timestamp]
};

export type GetAddressInfoParams = {
  token?: string,           // show balances for specified token address only
  showETHTotals?: 0 | 1,    // request total incoming and outcoming ETH values
};

export type GetAddressHistoryParams = {
  token?: string,          // show only specified token address operations
  type?: string,           // show operations of specified type only (transfer, approve, issuance, mint, burn, etc)
  limit?: number,          // maximum number of operations [1 - 10, default = 10]
  timestamp?: number,      // starting offset for operations [unix timestamp]
};

export type GetAddressTransactionsParams = {
  limit?: number,           // maximum number of operations [1 - 50, default = 10]
  timestamp?: number,       // starting offset for operations [unix timestamp]
  showZeroValues?: 0 | 1,   // show transactions with zero ETH value, default = 0
};

export type TokenOperation = {
  timestamp: number,        // operation timestamp
  transactionHash: string,  // transaction hash
  tokenInfo: TokenInfo,     // token data,
  type: string,             // operation type (transfer, approve, issuance, mint, burn, etc),
  address: string,          // operation target address (if one),
  from: string,             // source address (if two addresses involved),
  to: string,               // destination address (if two addresses involved),
  value: number,            // operation value (as is, not reduced to a floating point value),
};

export type GetTokenHistoryResponse = {
  operations: TokenOperation[],
};

export type GetTokenInfoResponse = TokenInfo;

export type GetAddressInfoResponse = {
  address: string,     // address,
  ETH: {               // ETH specific information
    balance: number,   // ETH balance
    totalIn: number,   // Total incoming ETH value (showETHTotals parameter should be set to get this value)
    totalOut: number,  // Total outgoing ETH value (showETHTotals parameter should be set to get this value)
  },
  contractInfo: {             // exists if specified address is a contract
    creatorAddress: string,   // contract creator address,
    transactionHash: string,  // contract creation transaction hash,
    timestamp: number,        // contract creation timestamp
  },
  tokenInfo: TokenInfo,    // exists if specified address is a token contract address (same format as token info),
  tokens: Array<{          // exists if specified address has any token balances
    tokenInfo: TokenInfo,  // token data (same format as token info),
    balance: number,       // token balance (as is, not reduced to a floating point value),
    totalIn: number,       // total incoming token value
    totalOut: number,      // total outgoing token value
  }>,
  countTxs: number,     // Total count of incoming and outcoming transactions (including creation one),
};

export type GetTxInfoResponse = {
  hash: string,           // transaction hash,
  timestamp: number,      // transaction block time,
  blockNumber: number,    // transaction block number,
  confirmations: number,  // number of confirmations,
  success: boolean,       // true if there were no errors during tx execution
  from: string,           // source address,
  to: string,             // destination address,
  value: number,          // ETH send value,
  input: string,          // transaction input data (hex),
  gasLimit: number,       // gas limit set to this transaction,
  gasUsed: string,        // gas used for this transaction,
  logs: Array<{           // event logs
    address: string,  // log record address
    topics: string,   // log record topics
    data: string,     // log record data
  }>,
  operations: TokenOperation[],  // token operations list for this transaction
};

export type GetAddressHistoryResponse = {
  operations: TokenOperation[],
};

export type GetAddressTxsResponse = Array<{
  timestamp: number,        // operation timestamp
  from: string,             // source address (if two addresses involved),
  to: string,               // destination address (if two addresses involved),
  hash: string,             // transaction hash
  value: string,            // ETH value (as is, not reduced to a floating point value),
  input: string,            // input data
  success: boolean,         // true if transactions was completed, false if failed
}>;

export type GetTokenPriceHistoryGroupedResponse = {
  history: {
    countTxs: Array<{            // grouped token history
      _id: {
        year: number,   // transaction year
        month: number,  // transaction month
        day: number,    // transaction day
      },
      ts: number,                // timestamp of the first transaction in group
      cnt: number,               // number of transaction in group
    }>,
    prices: Array<{              // grouped token price history
      ts: number,                // timestamp of the token price
      date: string,              // date of the token price in YYYY-MM-DD format
      open: number,              // open token price
      close: number,             // close token price
      high: number,              // high token price
      low: number,               // low token price
      volume: number,            // volume
      volumeConverted: number,   // volume in USD
      average: number,           // average token price
    }>,
  }
};
