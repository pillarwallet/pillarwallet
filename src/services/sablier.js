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

import { utils, Contract, BigNumber as EthersBigNumber } from 'ethers';
import { BigNumber } from 'bignumber.js';
import { getEnv } from 'configs/envConfig';

// constants
import { ETH } from 'constants/assetsConstants';
import {
  SABLIER_CREATE_STREAM,
  SABLIER_WITHDRAW,
  SABLIER_CANCEL_STREAM,
} from 'constants/sablierConstants';

// services
import { encodeContractMethod, getContract, buildERC20ApproveTransactionData } from 'services/assets';
import smartWalletService from 'services/smartWallet';
import { callSubgraph } from 'services/theGraph';

// utils
import { getEthereumProvider, reportErrorLog } from 'utils/common';
import { buildTxFeeInfo } from 'utils/smartWallet';

// abi
import SABLIER_ABI from 'abi/sablier.json';
import ERC20_CONTRACT_ABI from 'abi/erc20.json';

// types
import type { Asset } from 'models/Asset';
import type { Stream } from 'models/Sablier';


export const buildCreateStreamTransaction = (
  receiver: string,
  amount: EthersBigNumber,
  tokenAddress: string,
  startTimestamp: number,
  endTimestamp: number,
): string => {
  return encodeContractMethod(SABLIER_ABI, 'createStream', [
    receiver,
    amount,
    tokenAddress,
    startTimestamp,
    endTimestamp,
  ]);
};

export const fetchStreamBalance = (streamId: string, address: string): Promise<EthersBigNumber> => {
  const provider = getEthereumProvider(getEnv().NETWORK_PROVIDER);
  const contract = new Contract(getEnv().SABLIER_CONTRACT_ADDRESS, SABLIER_ABI, provider);
  return contract.balanceOf(streamId, address).catch((e) => {
    reportErrorLog('Error getting sablier stream balance', { message: e.message });
    return 0;
  });
};

export const getSablierWithdrawTransaction = (
  sender: string,
  amount: EthersBigNumber,
  asset: Asset,
  stream: Stream,
) => {
  const transactionData = encodeContractMethod(SABLIER_ABI, 'withdrawFromStream', [
    stream.id,
    amount,
  ]);
  return {
    from: sender,
    to: getEnv().SABLIER_CONTRACT_ADDRESS,
    data: transactionData,
    amount: 0,
    symbol: ETH,
    tag: SABLIER_WITHDRAW,
    extra: {
      symbol: asset.symbol,
      assetAddress: stream.token.id,
      amount,
      contactAddress: stream.sender,
      streamId: stream.id,
    },
  };
};

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

export const checkSablierAllowance = async (tokenAddress: string, sender: string): Promise<EthersBigNumber> => {
  const erc20Contract = getContract(tokenAddress, ERC20_CONTRACT_ABI);
  const approvedAmountBN = erc20Contract
    ? await erc20Contract.allowance(sender, getEnv().SABLIER_CONTRACT_ADDRESS)
    : EthersBigNumber.from(0);
  return approvedAmountBN;
};

export const getSmartWalletTxFee = async (transaction: Object, useGasToken: boolean): Promise<Object> => {
  const defaultResponse = { fee: new BigNumber('0'), error: true };
  const estimateTransaction = {
    data: transaction.data,
    recipient: transaction.to,
    value: transaction.amount,
  };

  const estimated = await smartWalletService
    .estimateAccountTransaction(estimateTransaction)
    .then(result => buildTxFeeInfo(result, useGasToken))
    .catch((e) => {
      reportErrorLog('Error getting sablier fee for transaction', {
        ...transaction,
        message: e.message,
      });
      return null;
    });

  if (!estimated) {
    return defaultResponse;
  }

  return estimated;
};

const getTxFeeAndTransactionPayload = async (_transactionPayload, useGasToken): Promise<Object> => {
  const { fee: txFeeInWei, gasToken, error } = await getSmartWalletTxFee(_transactionPayload, useGasToken);
  let transactionPayload = _transactionPayload;
  if (gasToken) {
    transactionPayload = { ...transactionPayload, gasToken };
  }

  transactionPayload = { ...transactionPayload, txFeeInWei };

  if (error) {
    return null;
  }

  return {
    gasToken,
    txFeeInWei,
    transactionPayload,
  };
};


export const getCancellationFeeAndTransaction = (stream: Stream, useGasToken: boolean): Promise<Object> => {
  const transactionData = encodeContractMethod(SABLIER_ABI, 'cancelStream', [
    stream.id,
  ]);
  const transactionPayload = {
    to: getEnv().SABLIER_CONTRACT_ADDRESS,
    data: transactionData,
    amount: 0,
    symbol: ETH,
    tag: SABLIER_CANCEL_STREAM,
    extra: {
      assetAddress: stream.token.id,
      amount: stream.deposit,
      contactAddress: stream.recipient,
      streamId: stream.id,
    },
  };

  return getTxFeeAndTransactionPayload(transactionPayload, useGasToken);
};

export const getCreateStreamFeeAndTransaction = async (
  sender: string,
  receiver: string,
  amount: EthersBigNumber,
  asset: Asset,
  startTimestamp: number,
  endTimestamp: number,
  useGasToken: boolean,
): Promise<Object> => {
  const createStreamTransactionData =
    buildCreateStreamTransaction(receiver, amount, asset.address, startTimestamp, endTimestamp);

  const approvedAmountBN = await checkSablierAllowance(asset.address, sender);

  let sablierCreateStreamTransaction = {
    from: sender,
    to: getEnv().SABLIER_CONTRACT_ADDRESS,
    data: createStreamTransactionData,
    amount: 0,
    symbol: ETH,
  };

  if (!approvedAmountBN || amount.gt(approvedAmountBN)) {
    const rawValue = 1000000000;
    const valueToApprove = utils.parseUnits(rawValue.toString(), asset.decimals);
    const approveTransactionData = buildERC20ApproveTransactionData(
      getEnv().SABLIER_CONTRACT_ADDRESS, valueToApprove, asset.decimals);

    sablierCreateStreamTransaction = {
      from: sender,
      to: asset.address,
      data: approveTransactionData,
      amount: 0,
      symbol: ETH,
      sequentialSmartWalletTransactions: [sablierCreateStreamTransaction],
    };
  }

  sablierCreateStreamTransaction = {
    ...sablierCreateStreamTransaction,
    extra: {
      assetAddress: asset.address,
      amount,
      contactAddress: receiver,
    },
    tag: SABLIER_CREATE_STREAM,
  };

  return getTxFeeAndTransactionPayload(sablierCreateStreamTransaction, useGasToken);
};
