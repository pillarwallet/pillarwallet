// @flow
import { PENDING } from 'constants/historyConstants';
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
}: TransactionEthers): Transaction => ({
  status: PENDING,
  gasUsed: parseFloat(utils.formatEther(gasPrice.mul(gasLimit))),
  value: utils.formatEther(value),
  from,
  hash,
  to,
  _id: hash,
  asset,
  timestamp: +new Date() / 1000, // seconds
  nbConfirmations: 0,
  transaction: {},
  __v: 0,
  receipt: {},
});
