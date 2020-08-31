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

import isEmpty from 'lodash.isempty';

import { getEnv } from 'configs/envConfig';

import { DAI, USDC } from 'constants/assetsConstants';

import {
  POOLTOGETHER_WITHDRAW_TRANSACTION,
  POOLTOGETHER_DEPOSIT_TRANSACTION,
} from 'constants/poolTogetherConstants';

import type { Transaction, TxPoolTogetherExtra } from 'models/Transaction';

import { getPoolTogetherTransactions } from 'services/poolTogether';

import { addressesEqual } from './assets';


export const getWinChance = (currentCount: number = 0, totalPoolTicketsCount: number = 0): number => {
  return (currentCount * 100) / (totalPoolTicketsCount > 0 ? totalPoolTicketsCount : 1); // win chance in %
};

export const isPoolTogetherTag = (tag: ?string) => {
  return tag && (tag === POOLTOGETHER_WITHDRAW_TRANSACTION || tag === POOLTOGETHER_DEPOSIT_TRANSACTION);
};

export const isPoolTogetherAddress = (address: string) => {
  return addressesEqual(getEnv().POOL_DAI_CONTRACT_ADDRESS, address)
    || addressesEqual(getEnv().POOL_USDC_CONTRACT_ADDRESS, address);
};

const buildPoolTogetherTransaction = (
  transaction: Transaction,
  poolTogetherTransactions: Object[],
) => {
  let extra: TxPoolTogetherExtra;
  let tag;
  const poolTogetherTransaction = poolTogetherTransactions.find(({ hash }) => hash === transaction.hash);
  if (poolTogetherTransaction) {
    extra = {
      symbol: poolTogetherTransaction.symbol,
      decimals: poolTogetherTransaction.decimals,
      amount: poolTogetherTransaction.amount,
    };
    ({ tag } = poolTogetherTransaction);
  }
  return {
    ...transaction,
    extra,
    tag,
  };
};

export const mapTransactionsPoolTogether = async (
  accountAddress: string,
  transactionHistory: Transaction[],
): Promise<Transaction[]> => {
  const daiTransactions = await getPoolTogetherTransactions(DAI, accountAddress);
  const usdcTransactions = await getPoolTogetherTransactions(USDC, accountAddress);

  const deposits = daiTransactions.deposits.concat(usdcTransactions.deposits);
  const withdrawals = daiTransactions.withdrawals.concat(usdcTransactions.withdrawals);

  const allPoolTransactions = deposits.concat(withdrawals);

  return transactionHistory.reduce((
    transactions,
    transaction,
    transactionIndex,
  ) => {
    const { to, tag, extra } = transaction;

    // do not update if there is no difference in the transaction
    if (isPoolTogetherTag(tag) && !isEmpty(extra)) return transactions;

    if (isPoolTogetherAddress(to)) {
      transactions[transactionIndex] = buildPoolTogetherTransaction(
        transaction,
        allPoolTransactions,
      );
    }

    return transactions;
  }, transactionHistory);
};
