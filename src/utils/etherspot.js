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
import { isEmpty } from 'lodash';
import { useQuery } from 'react-query';

// constants
import { TX_CONFIRMED_STATUS, TX_FAILED_STATUS, TX_PENDING_STATUS } from 'constants/historyConstants';
import { ASSET_CATEGORY } from 'constants/assetsConstants';
import { EXCHANGE_PROVIDER } from 'constants/exchangeConstants';
import { TRANSACTION_STATUS } from 'models/History';

// utils
import { isEtherspotAccount } from 'utils/accounts';
import { findAssetByAddress } from 'utils/assets';
import { fromEthersBigNumber } from 'utils/bigNumber';
import { chainFromChainId, nativeAssetPerChain } from 'utils/chains';
import { buildHistoryTransaction } from 'utils/history';
import { isCaseInsensitiveMatch } from 'utils/common';

// Services
import etherspotService from 'services/etherspot';

// types
import type {
  TokenListToken,
  ExchangeOffer as EtherspotExchangeOffer,
  GatewayEstimatedBatch,
} from 'utils/types/etherspot';
import type { Transaction, TransactionFeeInfo } from 'models/Transaction';
import type { Asset, AssetCore, AssetOption, AssetDataNavigationParam } from 'models/Asset';
import type { Account } from 'models/Account';
import type { Chain } from 'models/Chain';
import type { ExchangeProvider, ExchangeOffer } from 'models/Exchange';

const ETHERSPOT_TRANSACTION_HISTORY_STATUS = {
  COMPLETED: 'Completed',
  PENDING: 'Pending',
  REVERTED: 'Reverted',
};

export const parseEtherspotTransactionStatus = (transactionStatus: string) => {
  if (transactionStatus === ETHERSPOT_TRANSACTION_HISTORY_STATUS.COMPLETED) return TRANSACTION_STATUS.CONFIRMED;
  if (transactionStatus === ETHERSPOT_TRANSACTION_HISTORY_STATUS.REVERTED) return TRANSACTION_STATUS.FAILED;

  return TRANSACTION_STATUS.PENDING;
};

export const isEtherspotAccountDeployed = (account: ?Account, chain: Chain) => {
  if (!isEtherspotAccount(account)) return false;

  const etherspotAccount: ?EtherspotAccount = account.extra?.[chain];
  return etherspotAccount?.state === AccountStates.Deployed;
};

export function useTokenDetailsQuery(token: AssetDataNavigationParam) {
  const enabled = !!token;

  return useQuery(['GetTokenDetails', token], () => etherspotService.getTokenDetails(token), {
    enabled,
    cacheTime: 0,
  });
}

export function useMarketDetailsQuery(token: AssetDataNavigationParam) {
  const enabled = !!token;

  return useQuery(['GetMarketDetails', token], () => etherspotService.getMarketDetails(token), {
    enabled,
    cacheTime: 0,
  });
}

export function usePoolsActivityQuery(token: AssetDataNavigationParam) {
  const enabled = !!token;

  return useQuery(['GetPoolsActivity', token], () => etherspotService.getPoolsActivity(token), {
    enabled,
    cacheTime: 0,
  });
}

export function useTradingHistoryQuery(token: AssetDataNavigationParam) {
  const enabled = !!token;

  return useQuery(['GetTradingHistory', token], () => etherspotService.getTradingHistory(token), {
    enabled,
    cacheTime: 0,
  });
}

export function useHistoricalTokenPriceQuery(token: AssetDataNavigationParam, period: string) {
  const enabled = !!token && !!period;

  return useQuery(
    ['HistoricalTokenPrices', token, period],
    () => etherspotService.getHistoricalTokenPrice(token, period),
    {
      enabled,
      cacheTime: 0,
    },
  );
}

export const parseEtherspotTransactions = (
  chain: Chain,
  etherspotTransactions: EtherspotTransaction[],
  supportedAssets: Asset[],
): Transaction[] =>
  etherspotTransactions.reduce((mappedHistoryTransactions, etherspotTransaction) => {
    const {
      gasLimit,
      gasPrice,
      gasUsed,
      hash,
      status: rawStatus,
      asset: assetPayload,
      timestamp: createdAt,
      value: nativeAssetValue,
      batch,
    } = etherspotTransaction;
    let { to, from } = etherspotTransaction;

    let { address: assetAddress, symbol: assetSymbol } = nativeAssetPerChain[chain];
    let value = nativeAssetValue ?? EthersBigNumber.from(0);

    // from address on batch is the actual wallet addresses
    if (batch?.from) {
      ({ from } = batch);
    }

    if (assetPayload) {
      const {
        to: assetTo,
        from: assetFrom,
        value: assetValue,
        contract: contractAddress,
        name: assetName,
      } = assetPayload;

      if (assetTo) to = assetTo;
      if (assetFrom) from = assetFrom;

      value = assetValue;

      if (!isCaseInsensitiveMatch(assetName, nativeAssetPerChain[chain].symbol)) {
        const supportedAsset = findAssetByAddress(supportedAssets, contractAddress);

        // asset not supported
        if (!supportedAsset) return mappedHistoryTransactions;

        assetAddress = contractAddress;
        assetSymbol = supportedAsset.symbol;
      }
    }

    const status = parseEtherspotTransactionStatus(rawStatus);

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

  const gasPrice = new BigNumber(estimatedGasPrice.toString());

  if (!useGasToken || !gasToken) {
    return { fee: ethCost, gasPrice };
  }

  const gasTokenCost = null;

  return {
    fee: gasTokenCost,
    gasToken,
    gasPrice,
  };
};

export const parseEtherspotTransactionState = (state: GatewayBatchStates): ?string => {
  switch (state) {
    case GatewayBatchStates.Sent:
      return TX_CONFIRMED_STATUS;
    case GatewayBatchStates.Sending:
      return TX_PENDING_STATUS;
    case GatewayBatchStates.Resending:
      return TX_PENDING_STATUS;
    case GatewayBatchStates.Queued:
      return TX_PENDING_STATUS;
    case GatewayBatchStates.Reverted:
      return TX_FAILED_STATUS;
    default:
      return null;
  }
};

export const parseTokenListToken = ({ address, name, symbol, decimals, logoURI, chainId }: TokenListToken): Asset => {
  const hasValidIconUrl = logoURI?.startsWith('https://') || logoURI?.startsWith('http://');

  return {
    chain: chainFromChainId[chainId],
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
  captureFee: BigNumber,
): ExchangeOffer => {
  const { exchangeRate, transactions } = offer;
  const provider = parseExchangeProvider(offer.provider);
  const toAmount = fromEthersBigNumber(offer.receiveAmount, toAsset.decimals);

  // Note: etherspot exchange rate is quoted as FROM / TO, so we need to reverse it.
  return {
    provider,
    fromAsset,
    toAsset,
    fromAmount,
    toAmount,
    exchangeRate: 1 / exchangeRate,
    transactions,
    chain,
    captureFee,
  };
};

export const appendNativeAssetIfNeeded = (chain: Chain, assets: Asset[]): Asset[] => {
  const nativeAsset = nativeAssetPerChain[chain];

  const hasNativeAsset = assets.some((asset) => asset.symbol === nativeAsset.symbol);

  return hasNativeAsset ? assets : [nativeAsset, ...assets];
};

// TODO: handle gas token
export const buildTransactionFeeInfo = (estimated: ?GatewayEstimatedBatch): TransactionFeeInfo => {
  if (!estimated) return { fee: null };

  const { feeAmount } = estimated;
  // const nativeFee = fromEthersBigNumber(estimatedGasPrice, 0).times(estimatedGas);

  return { fee: feeAmount };
};

const exchangeProviderFromEtherspot = {
  [EtherspotExchangeProviders.OneInch]: EXCHANGE_PROVIDER.ONE_INCH,
  [EtherspotExchangeProviders.Uniswap]: EXCHANGE_PROVIDER.UNISWAP,
  [EtherspotExchangeProviders.Synthetix]: EXCHANGE_PROVIDER.SYNTHETIX,
  [EtherspotExchangeProviders.Sushiswap]: EXCHANGE_PROVIDER.SUSHISWAP,
  [EtherspotExchangeProviders.Paraswap]: EXCHANGE_PROVIDER.PARASWAP,
  [EtherspotExchangeProviders.Honeyswap]: EXCHANGE_PROVIDER.HONEYSWAP,
  [EXCHANGE_PROVIDER.LIFI]: EXCHANGE_PROVIDER.LIFI,
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

export const filteredWithDefaultAssets = (
  assets: AssetOption[],
  defaultAssets: AssetOption[],
  chain?: Chain,
): AssetOption[] => {
  if (!assets || !defaultAssets) return [];

  const newAssets = chain ? assets.filter((asset) => asset.chain === chain) : assets;

  const filteredDefaultAssets: AssetOption[] = defaultAssets?.filter(
    (defaultToken) => !newAssets.some((token) => isSameAsset(defaultToken, token)),
  );
  return chain ? filteredDefaultAssets?.filter((token) => token.chain === chain) : filteredDefaultAssets;
};

export const filteredWithStableAssets = (assets: AssetOption[], stableTokens: AssetOption[]): AssetOption[] => {
  if (!assets || !stableTokens) return [];

  return assets.filter((assetToken) => stableTokens?.some((stableToken) => isSameAsset(assetToken, stableToken)));
};

export const filteredWithChain = (assets: Asset[], chain: Chain): Asset[] => {
  if (isEmpty(assets)) return [];
  return chain ? assets.filter((asset) => asset.chain === chain) : assets;
};

const isSameAsset = (a: AssetOption, b: AssetOption) =>
  a.symbol === b.symbol && a?.address?.toLowerCase() === b?.address?.toLowerCase();
