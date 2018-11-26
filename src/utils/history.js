// @flow
import {
  TRANSACTION_CONFIRMATION_EVENT,
  TRANSACTION_PENDING_EVENT,
  TX_PENDING_STATUS,
} from 'constants/historyConstants';
import { utils } from 'ethers';
import type { Transaction, TransactionEthers } from 'models/Transaction';

export const buildHistoryTransaction = ({
  from,
  hash,
  to,
  value,
  gasPrice,
  gasLimit,
  asset,
  note,
}: TransactionEthers): Transaction => ({
  status: TX_PENDING_STATUS,
  gasUsed: parseFloat(utils.formatEther(gasPrice.mul(gasLimit))),
  gasPrice: Number(gasPrice),
  value: typeof value === 'object' ? value.toString() : value,
  from,
  hash,
  to,
  _id: hash,
  asset,
  createdAt: +new Date() / 1000, // seconds
  nbConfirmations: 0,
  transaction: {},
  __v: 0,
  receipt: {},
  note,
});

export const isTransactionEvent = (eventType: string) => {
  return [
    TRANSACTION_PENDING_EVENT,
    TRANSACTION_CONFIRMATION_EVENT,
  ].includes(eventType);
};
