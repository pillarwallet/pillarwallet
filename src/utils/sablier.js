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

import { BigNumber as EthersBigNumber } from 'ethers';
import { getEnv } from 'configs/envConfig';
import {
  SABLIER_CREATE_STREAM,
  SABLIER_WITHDRAW,
  SABLIER_CANCEL_STREAM,
} from 'constants/sablierConstants';
import { fetchUserStreams } from 'services/sablier';
import { addressesEqual } from 'utils/assets';
import { countDownDHMS } from 'utils/common';
import type { Stream } from 'models/Sablier';
import type { TxSablierExtra, Transaction } from 'models/Transaction';


export const getTimestamp = (date?: ?Date) => {
  if (!date) {
    date = new Date();
  }
  return Math.round(date.getTime() / 1000);
};

export const getTotalWithdrawn = (stream: Stream): EthersBigNumber => {
  const { withdrawals, cancellation } = stream;
  if (cancellation) {
    return EthersBigNumber.from(cancellation.recipientBalance);
  }
  const reducer = (withdrawn, withdrawal) => EthersBigNumber.from(withdrawal.amount).add(withdrawn);
  return withdrawals.reduce(reducer, EthersBigNumber.from(0));
};

export const getTotalStreamed = (stream: Stream): EthersBigNumber => {
  const {
    cancellation, startTime, stopTime, deposit, ratePerSecond,
  } = stream;

  if (cancellation) {
    return EthersBigNumber.from(cancellation.recipientBalance);
  }

  const now = getTimestamp();

  if (+startTime > now) {
    return EthersBigNumber.from(0);
  }
  if (+stopTime < now) {
    return EthersBigNumber.from(deposit);
  }
  return EthersBigNumber.from(ratePerSecond).mul(now - (+startTime));
};

export const getStreamBalance = (stream: Stream): EthersBigNumber => {
  const totalWithdrawn = getTotalWithdrawn(stream);
  const totalStreamed = getTotalStreamed(stream);

  return totalStreamed.sub(totalWithdrawn);
};

export const getStreamProgress = (stream: Stream): number => {
  const { deposit } = stream;
  return getTotalStreamed(stream) / EthersBigNumber.from(deposit);
};

export const getWithdrawnProgress = (stream: Stream): number => {
  const { deposit } = stream;
  return getTotalWithdrawn(stream) / EthersBigNumber.from(deposit);
};

export const hasStreamEnded = (stream: Stream) => {
  return stream.cancellation || (+stream.stopTime < getTimestamp());
};

export const streamCountDownDHMS = (stream: Stream) => {
  if (hasStreamEnded(stream)) {
    return countDownDHMS(0);
  }
  return countDownDHMS((+stream.stopTime - getTimestamp()) * 1000);
};

export const isSablierTransactionTag = (tag?: string): boolean => !!tag && [
  SABLIER_CREATE_STREAM,
  SABLIER_WITHDRAW,
  SABLIER_CANCEL_STREAM,
].includes(tag);

const buildSablierTransaction = (
  transaction: Transaction,
  streamsTransactions: Object[],
  outgoingStreams: Stream[],
  incomingStreams: Stream[],
) => {
  let tag;
  let extra: TxSablierExtra;
  const txHash = transaction.hash.toLowerCase();
  const sablierTransaction = streamsTransactions.find(({ id }) => id === txHash);

  if (sablierTransaction) {
    const stream = outgoingStreams.find(({ id }) => id === sablierTransaction.stream.id) ||
      incomingStreams.find(({ id }) => id === sablierTransaction.stream.id);
    if (!stream) {
      return transaction;
    }

    if (sablierTransaction.event === 'CreateStream') {
      tag = SABLIER_CREATE_STREAM;
      extra = {
        assetAddress: stream.token.id,
        amount: stream.deposit,
        contactAddress: stream.recipient,
        streamId: stream.id,
      };
    } else if (sablierTransaction.event === 'CancelStream') {
      tag = SABLIER_CANCEL_STREAM;
      extra = {
        assetAddress: stream.token.id,
        amount: stream.deposit,
        contactAddress: stream.recipient,
        streamId: stream.id,
      };
    } else if (sablierTransaction.event === 'WithdrawFromStream') {
      tag = SABLIER_WITHDRAW;
      const withdrawal = stream.withdrawals.find(({ id }) => id === txHash);
      if (withdrawal) {
        extra = {
          assetAddress: stream.token.id,
          amount: withdrawal.amount,
          contactAddress: stream.sender,
          streamId: stream.id,
        };
      }
    }
  }

  return {
    ...transaction,
    tag,
    extra,
  };
};

export const mapTransactionsHistoryWithSablier = async (
  accountAddress: string,
  transactionHistory: Transaction[],
): Promise<Transaction[]> => {
  const response = await fetchUserStreams(accountAddress).catch(() => null);

  if (!response) {
    return transactionHistory;
  }

  const { outgoingStreams, incomingStreams } = response;
  const outgoingStreamsTransactions = outgoingStreams.flatMap(stream => stream.txs);
  const incomingStreamsTransactions = incomingStreams.flatMap(stream => stream.txs);
  const streamsTransactions = outgoingStreamsTransactions.concat(incomingStreamsTransactions);

  const mappedHistory = transactionHistory.reduce((
    transactions,
    transaction,
    transactionIndex,
  ) => {
    const { to, tag } = transaction;
    if (isSablierTransactionTag(tag)) return transactions;
    if (addressesEqual(getEnv().SABLIER_CONTRACT_ADDRESS, to)) {
      transactions[transactionIndex] = buildSablierTransaction(
        transaction,
        streamsTransactions,
        outgoingStreams,
        incomingStreams,
      );
    }

    return transactions;
  }, transactionHistory);
  return mappedHistory;
};
