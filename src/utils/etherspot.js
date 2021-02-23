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
import { BigNumber as EthersBigNumber } from 'ethers';
import { type GatewayEstimatedBatch, GatewayBatchStates } from 'etherspot';

// constants
import { COLLECTIBLES, ETH } from 'constants/assetsConstants';
import { TX_CONFIRMED_STATUS, TX_FAILED_STATUS, TX_PENDING_STATUS } from 'constants/historyConstants';

// utils
import { parseTokenAmount } from 'utils/common';

// services
import { buildERC721TransactionData, encodeContractMethod } from 'services/assets';

// abi
import ERC20_CONTRACT_ABI from 'abi/erc20.json';

// types
import type { TransactionFeeInfo, TransactionPayload } from 'models/Transaction';
import type { EtherspotTransaction } from 'models/Etherspot';

export const buildTxFeeInfo = (estimated: ?GatewayEstimatedBatch, useGasToken: boolean = false): TransactionFeeInfo => {
  if (!estimated) return { fee: null };

  // TODO: revisit etherspot gasToken
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

export const buildToEtherspotTransaction = async (
  to: string,
  from: string,
  data: ?string,
  amount: string,
  symbol: ?string,
  decimals: number = 18,
  tokenType: ?string,
  contractAddress: ?string,
  tokenId: ?string,
) => {
  let value;

  if (tokenType !== COLLECTIBLES) {
    value = EthersBigNumber.from(parseTokenAmount(amount, decimals).toString());
    if (symbol !== ETH && !data && contractAddress) {
      data = encodeContractMethod(ERC20_CONTRACT_ABI, 'transfer', [to, value.toString()]);
      to = contractAddress;
      value = EthersBigNumber.from(0); // value is in encoded transfer method as data
    }
  } else if (contractAddress) {
    data = await buildERC721TransactionData({
      from,
      to,
      tokenId,
      contractAddress,
    });
    to = contractAddress;
    value = EthersBigNumber.from(0);
  }

  return { to, data, value };
};

export const mapToEtherspotTransactionsBatch = async (
  transaction: TransactionPayload,
  fromAddress: string,
): Promise<EtherspotTransaction[]> => {
  const {
    to,
    data,
    symbol,
    amount,
    contractAddress,
    tokenType,
    tokenId,
    decimals = 18,
    sequentialTransactions = [],
  } = transaction;

  const etherspotTransaction = await buildToEtherspotTransaction(
    to,
    fromAddress,
    data,
    amount.toString(),
    symbol,
    decimals,
    tokenType,
    contractAddress,
    tokenId,
  );

  let etherspotTransactions = [etherspotTransaction];

  // important: maintain array sequence, this gets mapped into arrays as well by reusing same method
  const mappedSequential = await Promise.all(sequentialTransactions.map((sequential) =>
    mapToEtherspotTransactionsBatch(sequential, fromAddress),
  ));

  // append sequential to transactions batch
  mappedSequential.forEach((sequential) => {
    etherspotTransactions = [
      ...etherspotTransactions,
      ...sequential,
    ];
  });

  return etherspotTransactions;
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
