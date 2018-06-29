// @flow
import { PENDING } from 'constants/historyConstants';
import { utils } from 'ethers';

export const buildHistoryTransaction = ({
  from,
  hash,
  to,
  value,
  gasPrice,
  asset,
}: Object) => ({
  status: PENDING,
  gasPrice: utils.formatEther(gasPrice),
  value: utils.formatEther(value),
  from,
  hash,
  to,
  _id: hash,
  asset,
  timestamp: +new Date(),
  nbConfirmations: 0,
});
