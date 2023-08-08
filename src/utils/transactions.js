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
import t from 'translations/translate';

// Components
import Toast from 'components/Toast';

// Constants
import { ADDRESS_ZERO, ASSET_TYPES } from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// Utils
import { getBalance } from 'utils/assets';
import { fromEthersBigNumber } from 'utils/bigNumber';
import { nativeAssetPerChain, mapChainToChainId } from 'utils/chains';
import { logBreadcrumb, getFormattedTransactionFeeValue } from 'utils/common';
import { openUrl } from 'utils/inAppBrowser';
import { getAssetRateInFiat } from 'utils/rates';

// Services
import { buildERC721TransactionData, encodeContractMethod } from 'services/assets';
import { firebaseRemoteConfig } from 'services/firebase';
import etherspotService from 'services/etherspot';

// Abi
import ERC20_CONTRACT_ABI from 'abi/erc20.json';
import ERC1155_CONTRACT_ABI from 'abi/erc1155.json';
import ERC721_CONTRACT_ABI from 'abi/erc721.json';

// Types
import type { AssetType } from 'models/Asset';
import type { FeeInfo } from 'models/PaymentNetwork';
import type { EthereumTransaction, GasToken, TransactionPayload } from 'models/Transaction';
import type { WalletAssetsBalances } from 'models/Balances';
import type { Chain } from 'models/Chain';
import type { Currency, RatesByAssetAddress } from 'models/Rates';

// Redux
import type { IGasThresholds } from 'redux/reducers/gas-threshold-reducer';

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
  const ethBalanceLeftAfterTransaction = ethBalance.minus(totalFeeInEth).minus(ethAmount);

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
      data = encodeContractMethod(ERC20_CONTRACT_ABI, 'transfer', [to, value.toString()], contractAddress, chain);
      to = contractAddress;
      value = EthersBigNumber.from(0); // value is in encoded transfer method as data
    }
  } else if (contractAddress && tokenId) {
    const approveData = encodeContractMethod(
      ERC1155_CONTRACT_ABI,
      'setApprovalForAll',
      [contractAddress, true],
      contractAddress,
      chain,
    );
    data = encodeContractMethod(
      ERC1155_CONTRACT_ABI,
      'safeTransferFrom',
      [from, to, tokenId, 1, approveData],
      contractAddress,
      chain,
    );
    to = contractAddress;
    value = EthersBigNumber.from(0);

    const erc721Contract = etherspotService.getContract(chain, ERC721_CONTRACT_ABI, contractAddress);
    const ownerAddress = await erc721Contract?.callOwnerOf(tokenId).catch((e) => {
      logBreadcrumb('ERC-721 Owner', 'failed: ERC-721 Owner address', { e });
      return null;
    });

    if (ownerAddress) {
      data = await buildERC721TransactionData({
        from,
        to,
        tokenId,
        contractAddress,
        useLegacyTransferMethod: !!useLegacyTransferMethod,
      });
    }
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
  const mappedSequential = await Promise.all(
    sequentialTransactions.map((sequential) => mapToEthereumTransactions(sequential, fromAddress)),
  );

  // append sequential to transactions batch
  mappedSequential.forEach((sequential) => {
    transactions = [...transactions, ...sequential];
  });

  return transactions;
};

// TODO: gasToken support
export const mapTransactionsToTransactionPayload = (
  chain: Chain,
  transactions: EthereumTransaction[],
): TransactionPayload => {
  let transactionPayload = mapTransactionToTransactionPayload(chain, transactions[0]);

  if (transactions.length > 1) {
    transactionPayload = {
      ...transactionPayload,
      sequentialTransactions: transactions
        .slice(1)
        .map((transaction) => mapTransactionToTransactionPayload(chain, transaction)),
    };
  }

  return { ...transactionPayload, chain };
};

// TODO: gas token support
const mapTransactionToTransactionPayload = (chain: Chain, transaction: EthereumTransaction): TransactionPayload => {
  const { symbol, decimals } = nativeAssetPerChain[chain];
  const { to, value, data } = transaction;
  const amount = fromEthersBigNumber(value, decimals).toFixed();

  return { to, amount, symbol, data, decimals };
};

export const getGasDecimals = (chain: Chain, gasToken: ?GasToken): number => {
  if (gasToken?.decimals) return gasToken.decimals;

  const chainNativeAsset = nativeAssetPerChain[chain];
  if (!chainNativeAsset) {
    logBreadcrumb('getGasDecimals', 'failed: no native asset for chain', { chain });
    return 18;
  }

  return chainNativeAsset.decimals;
};

export const getGasAddress = (chain: Chain, gasToken: ?GasToken): string => {
  if (gasToken?.address) return gasToken.address;

  const chainNativeAsset = nativeAssetPerChain[chain];
  if (!chainNativeAsset) {
    logBreadcrumb('getGasAddress', 'failed: no native asset for chain', { chain });
    return ADDRESS_ZERO;
  }

  return chainNativeAsset.address;
};

export const getGasSymbol = (chain: Chain, gasToken: ?GasToken): string => {
  if (gasToken?.symbol) return gasToken.symbol;

  const chainNativeAsset = nativeAssetPerChain[chain];
  if (!chainNativeAsset) {
    logBreadcrumb('getGasSymbol', 'failed: no native asset for chain', { chain });
    return nativeAssetPerChain.ethereum.symbol;
  }

  return chainNativeAsset.symbol;
};

/**
 * Standard check to allow transfer: value value, greater than zero & less than or equal to balance.
 */
export const isValidValueForTransfer = (value: ?BigNumber, balance: BigNumber): boolean %checks => {
  return !!value && value.isFinite() && value.gt(0) && value.lte(balance);
};

/**
 * Standard check to trigger not enough balance error message. Treats null value as zero.
 */
export const isLessThanOrEqualToBalance = (value: ?BigNumber, maxValue: BigNumber): boolean %checks => {
  return value?.lte(maxValue) ?? true;
};

export const showTransactionRevertedToast = () => {
  const transactionRevertedAricleURL = firebaseRemoteConfig.getString(REMOTE_CONFIG.TRANSACTION_REVERTED_ARTICLE_URL);
  Toast.show({
    message: t('toast.transactionReverted'),
    emoji: 'hushed',
    autoClose: false,
    onPress: () => {
      openUrl(transactionRevertedAricleURL);
    },
  });
};

export const getTxFeeInFiat = (
  chain: Chain,
  feeInWei: ?BigNumber | string | number,
  gasToken: ?GasToken,
  rates: RatesByAssetAddress,
  fiatCurrency: Currency,
) => {
  const feeValue = getFormattedTransactionFeeValue(chain, feeInWei, gasToken);
  const gasAddress = getGasAddress(chain, gasToken);
  const feeInFiat = parseFloat(feeValue) * getAssetRateInFiat(rates, gasAddress, fiatCurrency);
  return feeInFiat;
};

export const isHighGasFee = (
  chain: Chain,
  feeInWei: ?BigNumber | string | number,
  gasToken: ?GasToken,
  rates: RatesByAssetAddress,
  fiatCurrency: Currency,
  gasThresholds?: IGasThresholds,
) => {
  if (!chain || !feeInWei || !rates) return false;

  const fiatGasFee = getTxFeeInFiat(chain, feeInWei, gasToken, rates, fiatCurrency);
  const chainId = mapChainToChainId(chain);
  const threshold = gasThresholds?.[chainId]?.threshold || 0;

  if (!threshold) return false;

  if (fiatGasFee >= threshold) return true;

  return false;
};
