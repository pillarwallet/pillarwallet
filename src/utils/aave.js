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

// constants
import { ETH } from 'constants/assetsConstants';
import { AAVE_LENDING_DEPOSIT_TRANSACTION, AAVE_LENDING_WITHDRAW_TRANSACTION } from 'constants/transactionsConstants';

// services
import aaveService from 'services/aave';

// utils
import { isCaseInsensitiveMatch } from 'utils/common';
import { addressesEqual } from 'utils/assets';

// types
import type { Transaction, AaveExtra } from 'models/Transaction';
import type { Asset } from 'models/Asset';

export const AAVE_ETH_ADDRESS = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const parseReserveAssetAddress = (asset: Asset) => asset.symbol === ETH ? AAVE_ETH_ADDRESS : asset.address;

const buildAaveTransaction = (
  tag: string,
  transaction: Transaction,
  aaveTransactions: Object[],
) => {
  let extra: AaveExtra;
  const aaveTransaction = aaveTransactions.find(({
    id,
  }) => isCaseInsensitiveMatch(id.split(':')[0], transaction.hash));
  if (aaveTransaction) {
    extra = {
      symbol: aaveTransaction?.reserve?.symbol,
      decimals: aaveTransaction?.reserve?.decimals,
      amount: aaveTransaction?.amount,
    };
  }
  return {
    ...transaction,
    extra,
    tag,
  };
};

export const isAaveTransactionTag = (tag?: string): boolean => !!tag && [
  AAVE_LENDING_DEPOSIT_TRANSACTION,
  AAVE_LENDING_WITHDRAW_TRANSACTION,
].includes(tag);

export const mapTransactionsHistoryWithAave = async (
  accountAddress: string,
  transactionHistory: Transaction[],
): Promise<Transaction[]> => {
  const aaveLendingPoolContractAddress = await aaveService.getLendingPoolAddress();
  if (!aaveLendingPoolContractAddress) return [];

  const aaveTokenAddresses = await aaveService.getAaveTokenAddresses();
  const fetchedAaveTransactions = await aaveService.fetchAccountDepositAndWithdrawTransactions(accountAddress);
  const deposits = fetchedAaveTransactions?.deposits || [];
  const withdraws = fetchedAaveTransactions?.withdraws || [];

  return transactionHistory.reduce((
    transactions,
    transaction,
    transactionIndex,
  ) => {
    const { to, tag } = transaction;

    // do not update if already tagged
    if (isAaveTransactionTag(tag)) return transactions;

    if (addressesEqual(aaveLendingPoolContractAddress, to)) {
      transactions[transactionIndex] = buildAaveTransaction(
        AAVE_LENDING_DEPOSIT_TRANSACTION,
        transaction,
        deposits,
      );
    }

    if (aaveTokenAddresses.some((aaveTokenAddress) => addressesEqual(aaveTokenAddress, to))) {
      transactions[transactionIndex] = buildAaveTransaction(
        AAVE_LENDING_WITHDRAW_TRANSACTION,
        transaction,
        withdraws,
      );
    }

    return transactions;
  }, transactionHistory);
};
