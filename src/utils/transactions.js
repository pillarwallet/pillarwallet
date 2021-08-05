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

import get from 'lodash.get';
import { BigNumber } from 'bignumber.js';
import { BigNumber as EthersBigNumber, utils } from 'ethers';

// constants
import { ADDRESS_ZERO, ASSET_TYPES, ETH } from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';

// utils
import { getBalance } from 'utils/assets';
import { fromEthersBigNumber } from 'utils/bigNumber';
import { nativeAssetPerChain } from 'utils/chains';
import { reportErrorLog } from 'utils/common';

// services
import { buildERC721TransactionData, encodeContractMethod } from 'services/assets';

// abi
import ERC20_CONTRACT_ABI from 'abi/erc20.json';

// types
import type { AssetType } from 'models/Asset';
import type { FeeInfo } from 'models/PaymentNetwork';
import type { EthereumTransaction, GasToken, TransactionPayload } from 'models/Transaction';
import type { WalletAssetsBalances } from 'models/Balances';
import type { Chain } from 'models/Chain';

export const getTxFeeInWei = (useGasToken: boolean, feeInfo: ?FeeInfo): BigNumber | number => {
  const gasTokenCost = get(feeInfo, 'gasTokenCost');
  if (useGasToken && gasTokenCost) return gasTokenCost;
  return get(feeInfo, 'totalCost', 0); // TODO: return 'new BigNumber(0)' by default
};

export const getGasToken = (useGasToken: boolean, feeInfo: ?FeeInfo): ?GasToken => {
  return useGasToken ? get(feeInfo, 'gasToken', null) : null;
};

// note: returns negative if total balance is lower
export const calculateETHTransactionAmountAfterFee = (
  ethAmount: BigNumber,
  balances: WalletAssetsBalances,
  totalFeeInEth: BigNumber,
): BigNumber => {
  const ethBalance = new BigNumber(getBalance(balances, nativeAssetPerChain.ethereum.address));
  const ethBalanceLeftAfterTransaction = ethBalance
    .minus(totalFeeInEth)
    .minus(ethAmount);

  // check if not enough ETH left to cover fees and adjust ETH amount by calculating max available after fees
  if (!ethBalanceLeftAfterTransaction.isPositive()) {
    return ethBalance.minus(totalFeeInEth);
  }

  return ethAmount;
};

export const buildEthereumTransaction = async (
  to: string,
  from: string,
  data: ?string,
  amount: string,
  symbol: ?string,
  decimals: number = 18,
  tokenType: ?AssetType,
  contractAddress: ?string,
  tokenId: ?string,
  chain: Chain,
  useLegacyTransferMethod?: boolean,
): Promise<EthereumTransaction> => {
  let value;

  if (tokenType !== ASSET_TYPES.COLLECTIBLE) {
    const chainNativeSymbol = nativeAssetPerChain[chain].symbol;
    value = utils.parseUnits(amount, decimals);
    if (symbol !== chainNativeSymbol && !data && contractAddress) {
      data = encodeContractMethod(ERC20_CONTRACT_ABI, 'transfer', [to, value.toString()]);
      to = contractAddress;
      value = EthersBigNumber.from(0); // value is in encoded transfer method as data
    }
  } else if (contractAddress && tokenId) {
    console.log("BUILD", tokenType, symbol, useLegacyTransferMethod);
    data = await buildERC721TransactionData({
      from,
      to,
      tokenId,
      contractAddress,
      useLegacyTransferMethod: !!useLegacyTransferMethod,
    });
    to = contractAddress;
    value = EthersBigNumber.from(0);
  }

  let transaction = { to, value };

  if (data) transaction = { ...transaction, data };
  return transaction;
};

export const mapToEthereumTransactions = async (
  transactionPayload: TransactionPayload,
  fromAddress: string,
): Promise<EthereumTransaction[]> => {
  const {
    to,
    data,
    symbol,
    amount,
    contractAddress,
    tokenType,
    tokenId,
    decimals = 18,
    sequentialTransactions = [],
    chain = CHAIN.ETHEREUM,
    useLegacyTransferMethod,
  } = transactionPayload;

  const transaction = await buildEthereumTransaction(
    to,
    fromAddress,
    data,
    amount.toString(),
    symbol,
    decimals,
    tokenType,
    contractAddress,
    tokenId,
    chain,
    useLegacyTransferMethod,
  );

  let transactions = [transaction];

  // important: maintain array sequence, this gets mapped into arrays as well by reusing same method
  const mappedSequential = await Promise.all(sequentialTransactions.map((sequential) =>
    mapToEthereumTransactions(sequential, fromAddress),
  ));

  // append sequential to transactions batch
  mappedSequential.forEach((sequential) => {
    transactions = [
      ...transactions,
      ...sequential,
    ];
  });

  return transactions;
};

// TODO: gasToken support
export const mapTransactionsToTransactionPayload = (transactions: EthereumTransaction[]): TransactionPayload => {
  let transactionPayload = mapTransactionToTransactionPayload(transactions[0]);

  if (transactions.length > 1) {
    transactionPayload = {
      ...transactionPayload,
      sequentialTransactions: transactions.slice(1).map(mapTransactionToTransactionPayload),
    };
  }

  return transactionPayload;
};

// TODO: gas token support
const mapTransactionToTransactionPayload = (transaction: EthereumTransaction): TransactionPayload => {
  const { to, value, data } = transaction;
  const amount = fromEthersBigNumber(value, 18).toFixed();

  return { to, amount, symbol: ETH, data, decimals: 18 };
};

export const getGasDecimals = (chain: Chain, gasToken: ?GasToken): number => {
  if (gasToken?.decimals) return gasToken.decimals;

  const chainNativeAsset = nativeAssetPerChain[chain];
  if (!chainNativeAsset) {
    reportErrorLog('getGasDecimals failed: no native asset for chain', { chain });
    return 18;
  }

  return chainNativeAsset.decimals;
};

export const getGasAddress = (chain: Chain, gasToken: ?GasToken): string => {
  if (gasToken?.address) return gasToken.address;

  const chainNativeAsset = nativeAssetPerChain[chain];
  if (!chainNativeAsset) {
    reportErrorLog('getGasAddress failed: no native asset for chain', { chain });
    return ADDRESS_ZERO;
  }

  return chainNativeAsset.address;
};

export const getGasSymbol = (chain: Chain, gasToken: ?GasToken): string => {
  if (gasToken?.symbol) return gasToken.symbol;

  const chainNativeAsset = nativeAssetPerChain[chain];
  if (!chainNativeAsset) {
    reportErrorLog('getGasSymbol failed: no native asset for chain', { chain });
    return ETH;
  }

  return chainNativeAsset.symbol;
};
