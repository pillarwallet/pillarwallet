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
import {
  type Transaction as EtherspotTransaction,
  type Account as EtherspotAccount,
  ExchangeProviders as EtherspotExchangeProviders,
  AccountStates,
  GatewayBatchStates,
  AccountDashboardProtocols as EtherspotAccountDashboardProtocols,
} from 'etherspot';

// constants
import {
  TX_CONFIRMED_STATUS,
  TX_FAILED_STATUS,
  TX_PENDING_STATUS,
} from 'constants/historyConstants';
import { ASSET_CATEGORY, ETH } from 'constants/assetsConstants';
import { EXCHANGE_PROVIDER } from 'constants/exchangeConstants';
import { TRANSACTION_STATUS } from 'models/History';
import { CHAIN } from 'constants/chainConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// utils
import { isEtherspotAccount } from 'utils/accounts';
import { findAssetByAddress } from 'utils/assets';
import { fromEthersBigNumber } from 'utils/bigNumber';
import { nativeAssetPerChain } from 'utils/chains';
import { buildHistoryTransaction } from 'utils/history';
import { isProdEnv } from 'utils/environment';

// types
import type {
  TokenListToken,
  ExchangeOffer as EtherspotExchangeOffer,
  GatewayEstimatedBatch,
} from 'utils/types/etherspot';
import type { Transaction, TransactionFeeInfo } from 'models/Transaction';
import type { Asset, AssetCore } from 'models/Asset';
import type { Account } from 'models/Account';
import type { Chain } from 'models/Chain';
import type { ExchangeProvider, ExchangeOffer } from 'models/Exchange';

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
      timestamp: createdAt,
    } = etherspotTransaction;

    let { address: assetAddress, symbol: assetSymbol } = nativeAssetPerChain.ethereum;
    let value = EthersBigNumber.from(0);

    if (assetPayload) {
      const {
        value: assetValue,
        contract: contractAddress,
        name: assetName,
      } = assetPayload;

      value = assetValue;

      if (assetName !== ETH) {
        const supportedAsset = findAssetByAddress(supportedAssets, contractAddress);

        // asset not supported
        if (!supportedAsset) return mappedHistoryTransactions;

        assetAddress = contractAddress;
        assetSymbol = supportedAsset.symbol;
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
      assetSymbol,
      assetAddress,
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

  // $FlowFixMe: revisit etherspot gasToken once it's fully implemented
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

export const parseTokenListToken = ({ address, name, symbol, decimals, logoURI }: TokenListToken): Asset => {
  const hasValidIconUrl = logoURI?.startsWith('https://') || logoURI?.startsWith('http://');

  return {
    address,
    name,
    symbol,
    decimals,
    iconUrl: hasValidIconUrl ? logoURI : '',
  };
};

export const buildExchangeOffer = (
  chain: Chain,
  fromAsset: AssetCore,
  toAsset: AssetCore,
  fromAmount: BigNumber,
  offer: EtherspotExchangeOffer,
): ExchangeOffer => {
  const { exchangeRate, transactions } = offer;
  const provider = parseExchangeProvider(offer.provider);
  const toAmount = fromEthersBigNumber(offer.receiveAmount, toAsset.decimals);

  // Note: etherspot exchange rate is quoted as FROM / TO, so we need to reverse it.
  return { provider, fromAsset, toAsset, fromAmount, toAmount, exchangeRate: 1 / exchangeRate, transactions, chain };
};

export const appendNativeAssetIfNeeded = (chain: Chain, assets: Asset[]): Asset[] => {
  const nativeAsset = nativeAssetPerChain[chain];

  const hasNativeAsset = assets.some((asset) => asset.symbol === nativeAsset.symbol);

  return hasNativeAsset ? assets : [nativeAsset, ...assets];
};

// TODO: handle gas token
export const buildTransactionFeeInfo = (estimated: ?GatewayEstimatedBatch): TransactionFeeInfo => {
  if (!estimated) return { fee: null };

  const { estimatedGas, estimatedGasPrice } = estimated;

  const nativeFee = fromEthersBigNumber(estimatedGasPrice, 0).times(estimatedGas);
  return { fee: nativeFee };
};

const exchangeProviderFromEtherspot = {
  [EtherspotExchangeProviders.OneInch]: EXCHANGE_PROVIDER.ONE_INCH,
  [EtherspotExchangeProviders.Uniswap]: EXCHANGE_PROVIDER.UNISWAP,
  [EtherspotExchangeProviders.Synthetix]: EXCHANGE_PROVIDER.SYNTHETIX,
  [EtherspotExchangeProviders.Sushiswap]: EXCHANGE_PROVIDER.SUSHISWAP,
};

export const parseExchangeProvider = (provider: string): ?ExchangeProvider => {
  return exchangeProviderFromEtherspot[provider];
};

export const assetsCategoryFromEtherspotBalancesCategory = {
  [EtherspotAccountDashboardProtocols.Deposits]: ASSET_CATEGORY.DEPOSITS,
  [EtherspotAccountDashboardProtocols.LiquidityPools]: ASSET_CATEGORY.LIQUIDITY_POOLS,
  [EtherspotAccountDashboardProtocols.Investments]: ASSET_CATEGORY.INVESTMENTS,
  // TODO: enable once rewards available
  // [AccountDashboardProtocols.Rewards]: ASSET_CATEGORY.REWARDS
};

export const getChainTokenListName = (chain: Chain): ?string => {
  if (chain === CHAIN.ETHEREUM && isProdEnv()) {
    return firebaseRemoteConfig.getString(REMOTE_CONFIG.FEATURE_TOKEN_LIST_ETHEREUM);
  }

  if (chain === CHAIN.BINANCE) return firebaseRemoteConfig.getString(REMOTE_CONFIG.FEATURE_TOKEN_LIST_BSC);
  if (chain === CHAIN.POLYGON) return firebaseRemoteConfig.getString(REMOTE_CONFIG.FEATURE_TOKEN_LIST_POLYGON);

  return null;
};
