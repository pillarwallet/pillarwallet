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

import BigNumber from 'bignumber.js';
import type { GatewayEstimatedBatch } from 'etherspot';

// constants
import { COLLECTIBLES, ETH } from 'constants/assetsConstants';

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

export const mapToEtherspotTransactionsBatch = async (
  transaction: TransactionPayload,
  fromAddress: string,
): Promise<EtherspotTransaction[]> => {
  // $FlowFixMe
  const {
    symbol,
    amount,
    contractAddress,
    decimals = 18,
    sequentialTransactions = [],
  } = transaction;
  // $FlowFixMe
  let { to, data } = transaction;
  let value;

  if (transaction.tokenType !== COLLECTIBLES) {
    value = parseTokenAmount(amount.toString(), decimals);
    if (symbol !== ETH && !data) {
      data = encodeContractMethod(ERC20_CONTRACT_ABI, 'transfer', [to, value.toString()]);
      to = contractAddress;
      value = 0; // value is in encoded transfer method as data
    }
  } else {
    const { tokenId } = transaction;
    data = await buildERC721TransactionData({
      from: fromAddress,
      to,
      tokenId,
      contractAddress,
    });
    to = contractAddress;
    value = 0;
  }

  let etherspotTransactions = [{
    to,
    data,
    value,
  }];

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
