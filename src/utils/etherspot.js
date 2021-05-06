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

import { BigNumber } from 'bignumber.js';
import {
  type GatewayEstimatedBatch,
  type Transaction as EtherspotTransaction,
  GatewayBatchStates,
} from 'etherspot';

// constants
import { TX_CONFIRMED_STATUS, TX_FAILED_STATUS, TX_PENDING_STATUS } from 'constants/historyConstants';

// types
import type { Transaction, TransactionFeeInfo } from 'models/Transaction';
import type { Asset } from 'models/Asset';


export const buildEtherspotTxFeeInfo = (
  estimated: ?GatewayEstimatedBatch,
  useGasToken: boolean = false,
): TransactionFeeInfo => {
  if (!estimated) return { fee: null };

  // TODO: revisit etherspot gasToken once it's fully implemented
  const { estimatedGas, estimatedGasPrice, gasToken = null } = estimated;

  const ethCost = new BigNumber(estimatedGasPrice.mul(estimatedGas).toString());

  if (!useGasToken || !gasToken) {
    return { fee: ethCost };
  }

  const gasTokenCost = null;

  return {
    fee: gasTokenCost,
    gasToken,
  };
};

export const parseEtherspotTransactionState = (state: GatewayBatchStates): ?string => {
  switch (state) {
    case GatewayBatchStates.Sent: return TX_CONFIRMED_STATUS;
    case GatewayBatchStates.Sending: return TX_PENDING_STATUS;
    case GatewayBatchStates.Resending: return TX_PENDING_STATUS;
    case GatewayBatchStates.Queued: return TX_PENDING_STATUS;
    case GatewayBatchStates.Reverted: return TX_FAILED_STATUS;
    default: return null;
  }
};

// added eslint ignore to reduce #front-end noise as this piece is part of other branch
/* eslint-disable */
export const parseEtherspotTransactions = (
  etherspotTransactions: EtherspotTransaction[],
  supportedAssets: Asset[],
  assets: Asset[],
): Transaction[] => etherspotTransactions
  .reduce((mappedHistoryTransactions, etherspotTransaction) => {
    return mappedHistoryTransactions;
    // const {
    //   from,
    //   to,
    //   gasLimit,
    //   gasPrice,
    //   gasUsed,
    //   hash,
    //   status,
    //   value: ethValue,
    //   asset,
    // } = etherspotTransaction;
    //
    // if (asset) {
    //   const {
    //     name,
    //     value: assetValue,
    //     decimal,
    //     contract: contractAddress,
    //   } = asset;
    //   // const supportedAsset = find
    // }
    //
    // const mappedTransaction = buildHistoryTransaction({
    //
    // });
    // return [...mappedHistoryTransactions, mappedTransaction]
  }, []);
/* eslint-enable */
