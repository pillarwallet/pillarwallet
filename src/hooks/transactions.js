// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

import * as React from 'react';
import { useQuery } from 'react-query';
import { BigNumber } from 'bignumber.js';
import t from 'translations/translate';

// Constants
import { ETHERSPOT_WALLET_DEPLOYMENT_GAS_AMOUNT } from 'constants/etherspotConstants';

// Components
import Toast from 'components/Toast';

// Services
import etherspotService from 'services/etherspot';

// Selectors
import { useActiveAccount, useRootSelector } from 'selectors';
import { accountAssetsBalancesSelector } from 'selectors/balances';

// Utils
import { addressesEqual, isEnoughBalanceForTransactionFee } from 'utils/assets';
import { useChainConfig } from 'utils/uiConfig';
import { nativeAssetPerChain } from 'utils/chains';
import { isEtherspotAccount } from 'utils/accounts';
import { wrapBigNumber } from 'utils/bigNumber';

// Hooks
import { useDeploymentStatus } from 'hooks/deploymentStatus';

// Types
import type { QueryResult } from 'utils/types/react-query';
import type { AssetCore } from 'models/Asset';
import type { Chain } from 'models/Chain';
import type { EthereumTransaction, GasToken, TransactionFeeInfo } from 'models/Transaction';
import type { Value } from 'models/Value';

type UseTransactionEstimateResult = {|
  feeInfo: ?TransactionFeeInfo,
  errorMessage?: string,
  isEstimating: boolean,
  hideErrorNotification?: boolean,
|};

export function useTransactionsEstimate(
  chain: Chain,
  transactions: ?(EthereumTransaction[]),
  hideErrorNotification?: boolean,
  gasAsset?: AssetCore,
): UseTransactionEstimateResult {
  const enabled = !!transactions?.length && !!chain;

  const query: QueryResult<TransactionFeeInfo> = useQuery(
    ['TransactionsEstimate', transactions, gasAsset],
    () => etherspotService.setTransactionsBatchAndEstimate(chain, transactions ?? [], gasAsset?.address),
    { enabled, cacheTime: 0 },
  );

  const errorMessage = query.isError ? t('toast.transactionFeeEstimationFailed') : undefined;

  React.useEffect(() => {
    if (!errorMessage || hideErrorNotification) return;

    Toast.show({
      message: errorMessage,
      emoji: 'woman-shrugging',
      supportLink: true,
    });
  }, [errorMessage, hideErrorNotification]);

  if (query.data) {
    if (!query.data.gasToken) {
      query.data.gasToken = gasAsset;
    }
  }
  return {
    feeInfo: query.data,
    errorMessage,
    isEstimating: query.isFetching,
  };
}

type UseTransactionFeeCheckResult = {|
  isEnoughForFee: boolean,
  errorMessage?: string,
|};

export function useTransactionFeeCheck(
  chain: Chain,
  feeInfo: ?TransactionFeeInfo,
  txAsset?: ?AssetCore,
  txValue?: ?BigNumber,
): UseTransactionFeeCheckResult {
  const { gasSymbol } = useChainConfig(chain);
  const accountBalances = useRootSelector(accountAssetsBalancesSelector);
  const chainBalances = accountBalances?.[chain]?.wallet ?? {};

  if (!feeInfo) return { isEnoughForFee: true };

  const transaction = {
    txFeeInWei: feeInfo.fee,
    gasToken: feeInfo.gasToken,
    symbol: txAsset?.symbol,
    decimals: txAsset?.decimals,
    amount: txValue,
  };

  const isEnoughForFee = isEnoughBalanceForTransactionFee(chainBalances, transaction, chain);

  const errorMessage = !isEnoughForFee
    ? t('error.notEnoughTokenForFee', { token: feeInfo?.gasToken?.symbol || gasSymbol })
    : undefined;

  return { isEnoughForFee, errorMessage };
}

export function useEtherspotDeploymentFee(
  chain: Chain,
  transactionFee: ?Value,
  gasToken: ?GasToken,
): { deploymentFee: ?BigNumber, feeWithoutDeployment: ?Value } {
  const { isDeployedOnChain } = useDeploymentStatus();
  const activeAccount = useActiveAccount();

  const gasPrice = useRootSelector((root) => root.transactionEstimate?.feeInfo?.gasPrice);

  const nativeAssetAddress = nativeAssetPerChain?.[chain]?.address;

  // we cannot calculate fee based on non native gas token
  const isPaidWithNativeToken = !gasToken?.address || addressesEqual(gasToken.address, nativeAssetAddress);

  if (
    !transactionFee ||
    !gasPrice ||
    !isPaidWithNativeToken ||
    !isEtherspotAccount(activeAccount) ||
    isDeployedOnChain?.[chain]
  ) {
    return { deploymentFee: null, feeWithoutDeployment: transactionFee };
  }

  const deploymentFee = gasPrice.times(ETHERSPOT_WALLET_DEPLOYMENT_GAS_AMOUNT);
  const feeWithoutDeployment = wrapBigNumber(transactionFee).minus(deploymentFee);

  return { deploymentFee, feeWithoutDeployment };
}
