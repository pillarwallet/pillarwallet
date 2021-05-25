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
import isEmpty from 'lodash.isempty';
import {
  type GatewayEstimatedBatch,
  type Transaction as EtherspotTransaction,
  type Account as EtherspotAccount,
  AccountStates,
  GatewayBatchStates,
} from 'etherspot';

// constants
import {
  TX_CONFIRMED_STATUS,
  TX_FAILED_STATUS,
  TX_PENDING_STATUS,
} from 'constants/historyConstants';
import { ETH } from 'constants/assetsConstants';
import { TRANSACTION_STATUS } from 'models/History';

// utils
import { isEtherspotAccount } from 'utils/accounts';
import { getAssetDataByAddress } from 'utils/assets';
import { buildHistoryTransaction } from 'utils/history';

// types
import type { Transaction, TransactionFeeInfo } from 'models/Transaction';
import type { Asset } from 'models/Asset';
import type { Account } from 'models/Account';
import type { Chain } from 'models/Chain';


const ETHERSPOT_TRANSACTION_HISTORY_STATUS = {
  COMPLETED: 'Completed',
  PENDING: 'Pending',
  REVERTED: 'Reverted',
};

export const isEtherspotAccountDeployed = (account: ?Account, chain: Chain) => {
  if (!isEtherspotAccount(account)) return false;

  const etherspotAccount: ?EtherspotAccount = account.extra?.[chain];
  return etherspotAccount?.state === AccountStates.Deployed;
};

export const parseEtherspotTransactions = (
  etherspotTransactions: EtherspotTransaction[],
  accountAssets: Asset[],
  supportedAssets: Asset[],
): Transaction[] => etherspotTransactions
  .reduce((mappedHistoryTransactions, etherspotTransaction) => {
    const {
      from,
      to,
      gasLimit,
      gasPrice,
      gasUsed,
      hash,
      status: rawStatus,
      asset: assetPayload,
      createdAt,
    } = etherspotTransaction;

    let asset = ETH;
    let value = EthersBigNumber.from(0);

    if (assetPayload) {
      const {
        value: assetValue,
        contract: contractAddress,
        name: assetName,
      } = assetPayload;

      value = assetValue;

      if (assetName !== ETH) {
        const supportedAsset = getAssetDataByAddress(accountAssets, supportedAssets, contractAddress);
        if (isEmpty(supportedAsset)) {
          // asset not supported
          return mappedHistoryTransactions;
        }

        asset = supportedAsset.symbol;
      }
    }

    let status;
    switch (rawStatus) {
      case ETHERSPOT_TRANSACTION_HISTORY_STATUS.COMPLETED:
        status = TRANSACTION_STATUS.CONFIRMED;
        break;
      case ETHERSPOT_TRANSACTION_HISTORY_STATUS.PENDING:
        status = TRANSACTION_STATUS.PENDING;
        break;
      case ETHERSPOT_TRANSACTION_HISTORY_STATUS.REVERTED:
        status = TRANSACTION_STATUS.FAILED;
        break;
      default:
        status = TRANSACTION_STATUS.PENDING;
    }

    const mappedTransaction = buildHistoryTransaction({
      from,
      to,
      gasLimit,
      gasPrice,
      gasUsed,
      hash,
      value,
      asset,
      status,
      createdAt,
    });

    return [...mappedHistoryTransactions, mappedTransaction];
  }, []);

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
