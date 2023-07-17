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

import { BigNumber as EthersBigNumber, utils as EthersUtils, Wallet as EthersWallet } from 'ethers';
import {
  Sdk as EtherspotSdk,
  NetworkNames,
  Account as EtherspotAccount,
  Accounts as EtherspotAccounts,
  EnvNames,
  ENSNode,
  ENSNodeStates,
  GatewaySubmittedBatch,
  Notification as EtherspotNotification,
  IncreaseP2PPaymentChannelAmountDto,
  NotificationTypes,
  GatewayTransactionStates,
  Transaction as EtherspotTransaction,
  Currencies as EtherspotCurrencies,
  AccountStates,
  RateData,
} from 'etherspot';
import { map } from 'rxjs/operators';
import type { Subscription } from 'rxjs';
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';
import { isValidAddress, toChecksumAddress } from 'ethereumjs-util';
import { isEmpty } from 'lodash';

// abi
import ERC20_CONTRACT_ABI from 'abi/erc20.json';

// utils
import { BigNumber, getEnsName, parseTokenAmount, reportErrorLog, logBreadcrumb } from 'utils/common';
import { isProdEnv } from 'utils/environment';
import {
  parseTokenListToken,
  appendNativeAssetIfNeeded,
  buildExchangeOffer,
  buildTransactionFeeInfo,
} from 'utils/etherspot';
import { addressesEqual } from 'utils/assets';
import { nativeAssetPerChain, mapChainToChainId, mapProdChainId } from 'utils/chains';
import { mapToEthereumTransactions } from 'utils/transactions';
import { getCaptureFee } from 'utils/exchange';

// constants
import { ETH, ADDRESS_ZERO, ETHERSPOT_POPULAR_TOKENS } from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';
import { PROJECT_KEY } from 'constants/etherspotConstants';

// types
import type {
  TokenListToken,
  ExchangeOffer as EtherspotExchangeOffer,
  GatewayEstimatedBatch,
  EtherspotAccountTotalBalancesItem,
} from 'utils/types/etherspot';
import type { AssetCore, Asset, AssetOption, AssetDataNavigationParam } from 'models/Asset';
import type { WalletAssetBalance } from 'models/Balances';
import type { Chain, ChainRecord } from 'models/Chain';
import type { ExchangeOffer, Route } from 'models/Exchange';
import type {
  EthereumTransaction,
  TransactionPayload,
  TransactionResult,
  TransactionFeeInfo,
} from 'models/Transaction';
import type { GasPrice } from 'models/GasInfo';
import type { NftList } from 'etherspot';
import type { EtherspotErc20Interface } from 'models/Etherspot';

export class EtherspotService {
  sdk: EtherspotSdk;
  subscriptions: { [network: string]: ?Subscription } = {};
  instances: { [network: string]: EtherspotSdk } = {};
  supportedNetworks: Array<string> = [];

  async init(privateKey?: string, fcmToken: ?string = null): Promise<void> {
    const isMainnet = isProdEnv();

    /**
     * Note: This property is assigned here because
     * it requires the value of `isProdEnv` which,
     * if assigned at class method level - crashes
     * the app due to non-instantiation of the getEnv
     * function which is called from envConfig.js
     */
    this.supportedNetworks = [
      isMainnet ? NetworkNames.Mainnet : NetworkNames.Goerli,
      isMainnet ? NetworkNames.Bsc : NetworkNames.BscTest,
      isMainnet ? NetworkNames.Matic : NetworkNames.Mumbai,
      isMainnet ? NetworkNames.Xdai : NetworkNames.Sokol,
      isMainnet ? NetworkNames.Optimism : NetworkNames.OptimismGoerli,
      isMainnet ? NetworkNames.Arbitrum : NetworkNames.ArbitrumNitro,
    ];

    const primaryNetworkName = isMainnet ? NetworkNames.Mainnet : NetworkNames.Goerli;

    /**
     * Cycle through the supported networks and build an
     * array of instantiated instances
     */
    await Promise.all(
      this.supportedNetworks.map(async (networkName) => {
        const env =
          networkName !== NetworkNames.Goerli &&
          networkName !== NetworkNames.Mumbai &&
          networkName !== NetworkNames.Sokol &&
          networkName !== NetworkNames.BscTest &&
          networkName !== NetworkNames.ArbitrumNitro &&
          networkName !== NetworkNames.OptimismGoerli
            ? EnvNames.MainNets
            : EnvNames.TestNets;
        this.instances[networkName] = new EtherspotSdk(privateKey, {
          env,
          networkName,
          projectKey: PROJECT_KEY,
        });
        if (fcmToken) {
          try {
            await this.instances[networkName].createSession({ fcmToken });
          } catch (error) {
            reportErrorLog('EtherspotService network init failed at createSession', { networkName, error });
          }
          try {
            await this.instances[networkName].computeContractAccount({ sync: true });
          } catch (error) {
            reportErrorLog('EtherspotService network init failed at computeContractAccount', { networkName, error });
          }
        }
      }),
    );

    // Assign the primary instance of the default networkName to `sdk`
    this.sdk = this.instances[primaryNetworkName];
  }

  subscribe(callback: (chain: Chain, notification: EtherspotNotification) => mixed) {
    this.supportedNetworks.forEach((networkName) => {
      const sdk = this.instances[networkName];
      if (!sdk) {
        logBreadcrumb('EtherspotService', 'subscribe failed: no sdk instance for network name', { networkName });
        return;
      }

      this.unsubscribeNetworkEvents(networkName);

      const chain = chainFromNetworkName(networkName);
      if (!chain) {
        logBreadcrumb('EtherspotService', 'subscribe failed: no chain for network name', { networkName });
        return;
      }

      this.subscriptions[networkName] = sdk.notifications$
        .pipe(map((notification) => callback(chain, notification)))
        .subscribe();
    });
  }

  unsubscribeNetworkEvents(network: string) {
    const subscription = this.subscriptions[network];
    if (!subscription) return;
    subscription.unsubscribe();
    this.subscriptions[network] = null;
  }

  unsubscribe() {
    this.supportedNetworks.forEach((networkName) => this.unsubscribeNetworkEvents(networkName));
  }

  getSdkForChain(chain: Chain): ?EtherspotSdk {
    const network = networkNameFromChain(chain);
    if (!network) {
      logBreadcrumb('EtherspotService', 'getSdkForChain failed: no network', { chain });
      return null;
    }

    const sdk = this.instances[network];
    if (!sdk) {
      logBreadcrumb('EtherspotService', 'getSdkForChain failed: cannot get SDK instance', { chain, network });
      return null;
    }

    return sdk;
  }

  async fetchExchangeRates(chain: Chain, assetsAddresses: string[]): Promise<RateData> {
    const sdk = this.getSdkForChain(chain);
    if (!sdk) return null;

    const chainId = mapProdChainId(chain);

    const rateData = await sdk.fetchExchangeRates({ chainId, tokens: assetsAddresses });

    return rateData;
  }

  getAccountAddress(chain: Chain): ?string {
    const sdk = this.getSdkForChain(chain);
    if (!sdk) return null;

    return sdk.state.accountAddress;
  }

  getAccount(chain: Chain): ?Promise<?EtherspotAccount> {
    const sdk = this.getSdkForChain(chain);
    if (!sdk) return null;

    return sdk.getAccount({ address: sdk.state.accountAddress }).catch((error) => {
      reportErrorLog('EtherspotService getAccount failed', { error });
      return null;
    });
  }

  async getAccountPerChains(): Promise<ChainRecord<?EtherspotAccount>> {
    const ethereum = await this.getAccount(CHAIN.ETHEREUM);
    const binance = await this.getAccount(CHAIN.BINANCE);
    const polygon = await this.getAccount(CHAIN.POLYGON);
    const xdai = await this.getAccount(CHAIN.XDAI);
    const optimism = await this.getAccount(CHAIN.OPTIMISM);
    const arbitrum = await this.getAccount(CHAIN.ARBITRUM);

    return { ethereum, binance, polygon, xdai, optimism, arbitrum };
  }

  getAccounts(): Promise<?(EtherspotAccount[])> {
    return this.sdk
      .getConnectedAccounts()
      .then(({ items }: EtherspotAccounts) => items)
      .catch((error) => {
        reportErrorLog('EtherspotService getAccounts -> getConnectedAccounts failed', { error });
        return null;
      });
  }

  async estimateENSTransactionFee(chain: Chain): Promise<?TransactionFeeInfo> {
    const sdk = this.getSdkForChain(chain);
    if (!sdk) {
      logBreadcrumb('estimateENSTransactionFee', 'failed: no SDK for chain set');
      throw new Error(t('error.unableToSetTransaction'));
    }
    const { account: etherspotAccount } = sdk.state;
    let ensNode;
    let batch: ?GatewayEstimatedBatch = null;
    if (isProdEnv() && chain === CHAIN.ETHEREUM && !etherspotAccount?.ensNode) {
      try {
        ensNode = await this.getEnsNode(etherspotAccount.address);
      } catch (error) {
        reportErrorLog('estimateENSTransactionFee -> getEnsNode failed', {
          error,
          chain,
        });
      }
      if (ensNode && ensNode.state === ENSNodeStates.Reserved) {
        try {
          await sdk.batchClaimENSNode({ nameOrHashOrAddress: ensNode.name });
        } catch (error) {
          reportErrorLog('estimateENSTransactionFee -> batchClaimENSNode failed', {
            error,
            chain,
          });
        }
      }
      try {
        const result = await sdk.estimateGatewayBatch();
        batch = result?.estimation;
      } catch (error) {
        let etherspotErrorMessage;
        try {
          // parsing etherspot estimate error based on return scheme
          const errorMessageJson = JSON.parse(error.message.trim());
          [etherspotErrorMessage] = Object.values(errorMessageJson[0].constraints);
        } catch (e) {
          // unable to parse json
        }
        const errorMessage = etherspotErrorMessage || error?.message || t('error.unableToEstimateTransaction');
        reportErrorLog('estimateENSTransactionFee -> estimateGatewayBatch failed', { errorMessage, chain });
        throw new Error(errorMessage);
      }

      if (!batch) {
        logBreadcrumb('estimateENSTransactionFee', 'estimateTransactionsBatch returned null', {
          batch,
          chain,
        });
        return null;
      }
    }
    return buildTransactionFeeInfo(batch);
  }

  async getBalances(chain: Chain, accountAddress: string, supportedAssets: Asset[]): Promise<WalletAssetBalance[]> {
    const sdk = this.getSdkForChain(chain);
    if (!sdk) return [];

    const assetAddresses = supportedAssets
      // 0x0...0 is default native token address in our assets, but it's not a ERC20 token
      .filter(({ address }) => !addressesEqual(address, nativeAssetPerChain[chain].address))
      .map(({ address }) => address);

    let balancesRequestPayload = {
      account: accountAddress,
    };

    if (assetAddresses.length) {
      balancesRequestPayload = {
        ...balancesRequestPayload,
      };
    }

    // gets balances by provided token (asset) address and ETH balance regardless
    const accountBalances = await sdk.getAccountBalances(balancesRequestPayload).catch((error) => {
      reportErrorLog('EtherspotService getBalances -> getAccountBalances failed', { error, chain, accountAddress });
      return null;
    });

    if (!accountBalances?.items) {
      return []; // logged above, no balances
    }

    const nativeSymbol = nativeAssetPerChain[chain].symbol;

    return accountBalances.items.reduce((positiveBalances, asset) => {
      const { balance, token } = asset;

      const supportedAsset = supportedAssets.find(({ symbol: supportedSymbol, address: supportedAddress }) => {
        // `token === null` means it's chain native token
        if (token === null) return supportedSymbol === nativeSymbol;
        return addressesEqual(supportedAddress, token);
      });

      if (!supportedAsset) {
        logBreadcrumb('EtherspotService', 'getBalances asset mapping failed', {
          chain,
          token,
        });
        return positiveBalances;
      }

      const { decimals, symbol, address } = supportedAsset;

      const positiveBalance = EthersUtils.formatUnits(balance, decimals);

      // no need to return zero balance asset
      if (BigNumber(positiveBalance ?? 0).isZero()) {
        return positiveBalances;
      }

      return [...positiveBalances, { symbol, address, balance: positiveBalance }];
    }, []);
  }

  reserveEnsName(username: string): Promise<?ENSNode> {
    const fullEnsName = getEnsName(username);
    return this.sdk.reserveENSName({ name: fullEnsName }).catch((error) => {
      reportErrorLog('EtherspotService reserveENSName failed', { error, username, fullEnsName });
      return null;
    });
  }

  getEnsNode(nameOrHashOrAddress: string): Promise<?ENSNode> {
    // if it's address – getENSNode accepts only checksum addresses
    const nameOrHashOrChecksumAddress =
      nameOrHashOrAddress.startsWith('0x') && isValidAddress(nameOrHashOrAddress)
        ? toChecksumAddress(nameOrHashOrAddress)
        : nameOrHashOrAddress;

    return this.sdk.getENSNode({ nameOrHashOrAddress: nameOrHashOrChecksumAddress }).catch((error) => {
      reportErrorLog('getENSNode failed', { nameOrHashOrAddress, nameOrHashOrChecksumAddress, error });
      return null;
    });
  }

  isValidEnsName(name: string): Promise<boolean> {
    return this.sdk.validateENSName({ name }).catch((error) => {
      try {
        // eslint-disable-next-line max-len
        // ref https://github.com/etherspot/etherspot-backend-monorepo/blob/f879c0817aa18faa4f75c148131ecb9278184a2c/apps/ms-ens/src/ens.service.spec.ts#L163
        // eslint-disable-next-line i18next/no-literal-string
        const invalidUsernameErrorProperties = ['name', 'address', 'rootNode'];

        const errorMessageJson = JSON.parse(error.message);
        const { property } = errorMessageJson[0];

        if (!invalidUsernameErrorProperties.includes(property)) {
          logBreadcrumb('EtherspotService', 'isValidEnsName failed with unknown property', { property, error });
        }
      } catch (messageParseError) {
        reportErrorLog('EtherspotService isValidEnsName failed and error message parse failed', {
          error,
          messageParseError,
        });
      }

      return false;
    });
  }

  clearTransactionsBatch(chain: Chain): void {
    const sdk = this.getSdkForChain(chain);

    if (!sdk) {
      logBreadcrumb('clearTransactionsBatch', 'failed: no SDK for chain set', { chain });
      throw new Error(t('error.unableToResetTransactions'));
    }

    sdk.clearGatewayBatch();
  }

  async setTransactionsBatch(chain: Chain, transactions: EthereumTransaction[]) {
    const sdk = this.getSdkForChain(chain);

    if (!sdk) {
      logBreadcrumb('setTransactionsBatch', 'failed: no SDK for chain set', { transactions, chain });
      throw new Error(t('error.unableToSetTransaction'));
    }

    const { account: etherspotAccount } = sdk.state;
    if (etherspotAccount.state === AccountStates.UnDeployed) {
      /**
       * batchDeployAccount on back-end additionally checks if account is deployed
       * regardless of our state check and either skips or adds deployment transaction.
       */
      await sdk.batchDeployAccount();
    }

    return Promise.all(transactions.map((transaction) => sdk.batchExecuteAccountTransaction(transaction)));
  }

  async setBatchDeployAccount(chain: Chain, returnHash?: boolean = false) {
    const sdk = this.getSdkForChain(chain);

    if (!sdk) {
      logBreadcrumb('setBatchDeployAccount', 'failed: no SDK for chain set', { chain });
      return null;
    }

    const etherspotAccount = await this.getAccount(chain);

    // Return if account is already deployed.
    if (!etherspotAccount || etherspotAccount?.state !== AccountStates.UnDeployed) {
      return AccountStates.Deployed;
    }

    // Remove all previous executed transactions
    this.clearTransactionsBatch(chain);

    /*
     ! This method is useful in only mainnets (Polygon or Gnosis). testnets in need gas token.
     */
    // Deploy particular network (Polygon or Gnosis)
    await sdk.batchDeployAccount();

    // Estimate for deploy account transaction
    try {
      await this.estimateTransactionsBatch(chain);
    } catch (e) {
      reportErrorLog('setBatchDeployAccount -> estimateTransactionsBatch failed', { error: e, chain });
      return AccountStates.UnDeployed;
    }

    try {
      const { hash } = await sdk.submitGatewayBatch();
      if (returnHash) return hash;
      await this.waitForTransactionHashFromSubmittedBatch(chain, hash);
    } catch (e) {
      reportErrorLog('setBatchDeployAccount -> sdk.submitGatewayBatch failed', { error: e, chain });
      return AccountStates.UnDeployed;
    }

    /*
     * Taken little bit more time for transaction response
     * Account Deployed after submittedBatch response
     */

    return AccountStates.Deployed;
  }

  estimateTransactionsBatch(chain: Chain, useGasTokenAddress?: string): Promise<?GatewayEstimatedBatch> {
    const sdk = this.getSdkForChain(chain);
    if (!sdk) {
      logBreadcrumb('estimateTransactionsBatch', 'failed: no SDK for chain set', { chain });
      throw new Error(t('error.unableToEstimateTransaction'));
    }

    const isNativeAddress = useGasTokenAddress === ADDRESS_ZERO;

    return sdk
      .estimateGatewayBatch({ feeToken: isNativeAddress ? null : useGasTokenAddress })
      .then((result) => result?.estimation)
      .catch((error) => {
        let etherspotErrorMessage;
        try {
          // parsing etherspot estimate error based on return scheme
          const errorMessageJson = JSON.parse(error.message.trim());
          [etherspotErrorMessage] = Object.values(errorMessageJson[0].constraints);
        } catch (e) {
          // unable to parse json
        }

        const errorMessage = etherspotErrorMessage || error?.message || t('error.unableToEstimateTransaction');
        reportErrorLog('estimateTransactionsBatch -> estimateGatewayBatch failed', { errorMessage, chain });
        throw new Error(errorMessage);
      });
  }

  /** High-level method to estimate etherspot-format transaction data. */
  async setTransactionsBatchAndEstimate(
    chain: Chain,
    transactions: EthereumTransaction[],
    useGasTokenAddress?: string,
  ): Promise<?TransactionFeeInfo> {
    try {
      this.clearTransactionsBatch(chain);
    } catch (error) {
      reportErrorLog('setTransactionsBatchAndEstimate -> clearTransactionsBatch failed', {
        error,
        chain,
        transactions,
      });
      throw error;
    }

    try {
      await this.setTransactionsBatch(chain, transactions);
    } catch (error) {
      reportErrorLog('setTransactionsBatchAndEstimate -> setTransactionsBatch failed', { error, chain, transactions });
      throw error;
    }

    let batch: ?GatewayEstimatedBatch = null;
    try {
      batch = await this.estimateTransactionsBatch(chain, useGasTokenAddress);
    } catch (error) {
      reportErrorLog('setTransactionsBatchAndEstimate -> estimateTransactionsBatch failed', {
        error,
        chain,
        transactions,
      });
      throw error;
    }

    if (!batch) {
      logBreadcrumb('setTransactionsBatchAndEstimate', 'estimateTransactionsBatch returned null', {
        batch,
        chain,
        transactions,
      });
      return null;
    }

    return buildTransactionFeeInfo(batch);
  }

  async setTransactionsBatchAndSend(
    transactions: EthereumTransaction[],
    chain: Chain,
    useGasTokenAddress?: string,
  ): Promise<?TransactionResult> {
    // clear batch
    this.clearTransactionsBatch(chain);

    // set batch
    await this.setTransactionsBatch(chain, transactions).catch((error) => {
      reportErrorLog('setTransactionsBatchAndSend -> setTransactionsBatch failed', { error, transactions, chain });
      throw error;
    });

    // estimate current batch
    await this.estimateTransactionsBatch(chain, useGasTokenAddress);

    const sdk = this.getSdkForChain(chain);
    if (!sdk) {
      logBreadcrumb('setTransactionsBatchAndSend', 'failed: no SDK for chain set', { transactions, chain });
      throw new Error(t('error.unableToSendTransaction'));
    }

    // submit current batch
    const { hash: batchHash } = await sdk.submitGatewayBatch();

    return { batchHash };
  }

  async sendP2PTransaction(transaction: TransactionPayload) {
    const { to: recipient, amount, decimals } = transaction;

    const increaseRequest: IncreaseP2PPaymentChannelAmountDto = {
      token: transaction.symbol === ETH ? null : transaction.contractAddress,
      value: parseTokenAmount(amount.toString(), decimals).toString(),
      recipient,
    };

    const { hash } = await this.sdk.increaseP2PPaymentChannelAmount(increaseRequest);

    return { hash };
  }

  async sendTransaction(
    transaction: TransactionPayload,
    fromAccountAddress: string,
    chain: Chain,
    isP2P?: boolean,
  ): Promise<?TransactionResult> {
    if (isP2P) {
      // TODO: uncomment P2P partial implementation once it's available for Etherspot
      // return this.sendP2PTransaction(transaction);
    }

    const etherspotTransactions = await mapToEthereumTransactions(transaction, fromAccountAddress);

    if (transaction?.gasToken) {
      const {
        gasToken: { address: gasFeeAddress },
      } = transaction;
      return this.setTransactionsBatchAndSend(etherspotTransactions, chain, gasFeeAddress);
    }

    return this.setTransactionsBatchAndSend(etherspotTransactions, chain);
  }

  async sendENSTransaction(chain: Chain): Promise<?TransactionResult> {
    const sdk = this.getSdkForChain(chain);
    if (!sdk) {
      logBreadcrumb('setTransactionsBatchAndSend', 'failed: no SDK for chain set', { chain });
      throw new Error(t('error.unableToSendTransaction'));
    }

    // submit current batch
    const { hash: batchHash } = await sdk.submitGatewayBatch();

    return { batchHash };
  }

  getSubmittedBatchByHash(chain: Chain, hash: string): ?Promise<?GatewaySubmittedBatch> {
    const sdk = this.getSdkForChain(chain);
    if (!sdk) {
      logBreadcrumb('getSubmittedBatchByHash', 'failed: no SDK for chain set', { chain });
      return null;
    }

    return sdk.getGatewaySubmittedBatch({ hash }).catch((error) => {
      reportErrorLog('getSubmittedBatchByHash failed', { hash, error });
      return null;
    });
  }

  async getAccountInvestments(chain: Chain, address: string): any {
    const sdk = this.getSdkForChain(chain);
    if (!sdk) {
      logBreadcrumb('getSubmittedBatchByHash', 'failed: no SDK for chain set', { chain });
      return null;
    }

    try {
      const listsOfHoldings = await sdk.getAccountInvestments({
        account: address,
      });
      return listsOfHoldings;
    } catch (error) {
      reportErrorLog('getAccountInvestments -> Apps holdings failed', { address, chain, error });
      return null;
    }
  }

  async getTokenDetails(token: AssetDataNavigationParam) {
    const { chain, contractAddress } = token;

    const sdk = this.getSdkForChain(chain);
    if (!sdk) {
      logBreadcrumb('getTokenDetails', 'failed: no SDK for get token details', { chain });
      return null;
    }

    const nativeAddress = nativeAssetPerChain[chain].address;

    try {
      const tokenDetails = await sdk.getTokenDetails({
        tokenAddress: contractAddress,
        chainId: mapChainToChainId(chain),
        // eslint-disable-next-line i18next/no-literal-string
        provider: nativeAddress && 'dex-guru',
      });
      return tokenDetails;
    } catch (error) {
      reportErrorLog('getTokenDetails -> token details failed', { token, error });
      return null;
    }
  }

  async getHistoricalTokenPrice(token: AssetDataNavigationParam, period: string) {
    const { chain, contractAddress } = token;

    const sdk = this.getSdkForChain(chain);
    if (!sdk) {
      logBreadcrumb('getHistoricalTokenPrice', 'failed: no SDK for get historical token price', { chain });
      return null;
    }

    try {
      const historicalTokenPrice = await sdk.getHistoricalTokenPrice({
        tokenAddress: contractAddress,
        chainId: mapChainToChainId(chain),
        timePeriod: period,
      });
      return historicalTokenPrice;
    } catch (error) {
      reportErrorLog('getHistoricalTokenPrice -> historical token price failed', { token, error });
      return null;
    }
  }

  async getMarketDetails(token: AssetDataNavigationParam) {
    const { chain, contractAddress } = token;

    const sdk = this.getSdkForChain(chain);
    if (!sdk) {
      logBreadcrumb('getMarketDetails', 'failed: no SDK for get market details', { chain });
      return null;
    }

    try {
      const marketDetails = await sdk.getMarketDetails({
        tokenAddress: contractAddress,
        chainId: mapChainToChainId(chain),
      });
      return marketDetails;
    } catch (error) {
      reportErrorLog('getMarketDetails -> market details failed', { token, error });
      return null;
    }
  }

  async getPoolsActivity(token: AssetDataNavigationParam) {
    const { chain, contractAddress } = token;

    const sdk = this.getSdkForChain(chain);
    if (!sdk) {
      logBreadcrumb('getPoolsActivity', 'failed: no SDK for get pools activity', { chain });
      return null;
    }

    try {
      const poolsActivity = await sdk.getPoolsActivity({
        tokenAddress: contractAddress,
        chainId: mapChainToChainId(chain),
        page: 1,
      });
      return poolsActivity;
    } catch (error) {
      reportErrorLog('getPoolsActivity -> pools activity failed', { token, error });
      return null;
    }
  }

  async getTradingHistory(token: AssetDataNavigationParam) {
    const { chain, contractAddress } = token;

    const sdk = this.getSdkForChain(chain);
    if (!sdk) {
      logBreadcrumb('getTradingHistory', 'failed: no SDK for get trading history', { chain });
      return null;
    }

    try {
      const poolsActivity = await sdk.getTradingHistory({
        tokenAddress: contractAddress,
        chainId: mapChainToChainId(chain),
        page: 1,
      });
      return poolsActivity;
    } catch (error) {
      reportErrorLog('getTradingHistory -> trading history failed', { token, error });
      return null;
    }
  }

  async getTransactionExplorerLinkByBatch(chain: Chain, batchHash: string): Promise<?string> {
    const submittedBatch = await this.getSubmittedBatchByHash(chain, batchHash);

    const transactionHash = submittedBatch?.transaction?.hash;
    if (!transactionHash) return null;

    return this.getTransactionExplorerLink(chain, transactionHash);
  }

  getTransactionExplorerLink(chain: Chain, transactionHash: string): string {
    let blockchainExplorerUrl;

    switch (chain) {
      case CHAIN.POLYGON:
        blockchainExplorerUrl = getEnv().TX_DETAILS_URL_POLYGON;
        break;
      case CHAIN.XDAI:
        blockchainExplorerUrl = getEnv().TX_DETAILS_URL_XDAI;
        break;
      case CHAIN.BINANCE:
        blockchainExplorerUrl = getEnv().TX_DETAILS_URL_BINANCE;
        break;
      case CHAIN.OPTIMISM:
        blockchainExplorerUrl = getEnv().TX_DETAILS_URL_OPTIMISM;
        break;
      case CHAIN.ARBITRUM:
        blockchainExplorerUrl = getEnv().TX_DETAILS_URL_ARBITRUM;
        break;
      default:
        blockchainExplorerUrl = getEnv().TX_DETAILS_URL_ETHEREUM;
        break;
    }

    return `${blockchainExplorerUrl}${transactionHash}`;
  }

  waitForTransactionHashFromSubmittedBatch(chain: Chain, batchHash: string): Promise<string> {
    const sdk = this.getSdkForChain(chain);
    if (!sdk) {
      logBreadcrumb(
        'EtherspotService',
        'waitForTransactionHashFromSubmittedBatch failed: no sdk instance for network name',
        { chain },
      );
      // fail gracefully as transaction has been sent anyway
      return Promise.resolve();
    }

    let temporaryBatchSubscription;

    return new Promise((resolve, reject) => {
      temporaryBatchSubscription = sdk.notifications$
        .pipe(
          map(async (notification) => {
            if (notification.type === NotificationTypes.GatewayBatchUpdated) {
              const submittedBatch = await sdk.getGatewaySubmittedBatch({ hash: batchHash });

              const failedStates = [
                GatewayTransactionStates.Canceling,
                GatewayTransactionStates.Canceled,
                GatewayTransactionStates.Reverted,
              ];

              let finishSubscription;
              if (submittedBatch?.transaction?.state && failedStates.includes(submittedBatch?.transaction?.state)) {
                finishSubscription = () => reject(submittedBatch.transaction.state);
              } else if (submittedBatch?.transaction?.hash) {
                finishSubscription = () => resolve(submittedBatch.transaction.hash);
              }

              if (finishSubscription) {
                if (temporaryBatchSubscription) temporaryBatchSubscription.unsubscribe();
                finishSubscription();
              }
            }
          }),
        )
        .subscribe();
    });
  }

  async getTransactionsByAddress(chain: Chain, address: string): Promise<?(EtherspotTransaction[])> {
    const sdk = this.getSdkForChain(chain);
    if (!sdk) {
      logBreadcrumb('getTransactionsByAddress', 'getSupportedAssetsByChain failed: no sdk instance for chain', {
        chain,
      });
      return null;
    }

    return sdk
      .getTransactions({ account: sdk.state.accountAddress })
      .then(({ items }) => items)
      .catch((error) => {
        reportErrorLog('getTransactionsByAddress -> getTransactions failed', { address, chain, error });
        return null;
      });
  }

  async getAccountTotalBalances(
    accountAddress: string,
    currencySymbol: EtherspotCurrencies,
  ): Promise<?(EtherspotAccountTotalBalancesItem[])> {
    try {
      const { totalBalances } = await this.sdk.getAccountTotalBalances({
        account: accountAddress,
        currency: currencySymbol,
      });

      return totalBalances;
    } catch (error) {
      reportErrorLog('EtherspotService getAccountTotalBalances failed', {
        error,
        accountAddress,
        currencySymbol,
      });
      return null;
    }
  }

  async getSupportedAssets(chain: Chain): Promise<?(Asset[])> {
    const sdk = this.getSdkForChain(chain);
    if (!sdk) {
      logBreadcrumb('getSupportedAssetsByChain', 'failed: no sdk instance for chain', { chain });
      return null;
    }

    try {
      let tokens: TokenListToken[] = await sdk.getTokenListTokens({ name: ETHERSPOT_POPULAR_TOKENS });

      if (!tokens) {
        logBreadcrumb('getSupportedAssetsByChain', 'EtherspotService getSupportedAssets failed: no tokens returned', {
          ETHERSPOT_POPULAR_TOKENS,
        });
        tokens = []; // let append native assets
      }

      let supportedAssets = tokens.map((token) => parseTokenListToken(token));

      supportedAssets = appendNativeAssetIfNeeded(chain, supportedAssets);

      return supportedAssets;
    } catch (error) {
      reportErrorLog('EtherspotService getSupportedAssets failed', { error });
      return null;
    }
  }

  async logout(): Promise<void> {
    if (!this.sdk) return; // not initialized, nothing to do

    await this.sdk.destroy();
    this.sdk = null;
  }

  async resolveName(chain: Chain, name: ?string): Promise<any | null> {
    const sdk = this.getSdkForChain(chain);
    if (!sdk) return null;

    const chainId = mapChainToChainId(chain);

    try {
      const response = await sdk.resolveName({
        chainId,
        name,
      });

      logBreadcrumb('Resolve Name!', 'resolveName response', { response, name });

      if (response.failed) return null;

      if (response.results) {
        const { ens, fio, unstoppabledomains } = response.results;
        if (ens?.[0]) {
          return ens;
        }
        if (fio?.[0]) {
          return fio;
        }
        if (unstoppabledomains?.[0]) {
          return unstoppabledomains;
        }
        return null;
      }
    } catch (e) {
      reportErrorLog('EtherspotService resolveName failed', { chain, name });
      return null;
    }
    return null;
  }

  async getExchangeOffers(
    chain: Chain,
    fromAsset: ?AssetCore,
    toAsset: ?AssetCore,
    fromAmount: BigNumber,
  ): Promise<ExchangeOffer[]> {
    const sdk = this.getSdkForChain(chain);
    if (!sdk || !fromAsset || !toAsset) return [];

    const captureFee = getCaptureFee(fromAmount); // can be 0
    const fromAmountAfterCaptureFee = fromAmount.minus(captureFee);
    const fromAmountEthers = EthersUtils.parseUnits(fromAmountAfterCaptureFee.toString(), fromAsset.decimals);

    try {
      const offers: EtherspotExchangeOffer[] = await sdk.getExchangeOffers({
        fromTokenAddress: fromAsset.address,
        toTokenAddress: toAsset.address,
        fromAmount: fromAmountEthers,
        // Optional
        fromChainId: mapChainToChainId(chain),
      });

      return offers
        .map((offer) => buildExchangeOffer(chain, fromAsset, toAsset, fromAmount, offer, captureFee))
        .filter((offer) => !!offer.provider);
    } catch (error) {
      reportErrorLog('EtherspotService getExchangeOffers failed', { chain, error });
      return [];
    }
  }

  async buildCrossChainBridgeTransaction(fromAsset: AssetOption, toAsset: AssetOption, fromValue: BigNumber) {
    const sdk = this.getSdkForChain(fromAsset.chain);
    if (!sdk) return null;

    const value = EthersUtils.parseUnits(fromValue.toString(), fromAsset.decimals);

    try {
      const routes = await sdk.getAdvanceRoutesLiFi({
        fromTokenAddress: fromAsset.address,
        fromChainId: mapChainToChainId(fromAsset.chain),
        toTokenAddress: toAsset.address,
        toChainId: mapChainToChainId(toAsset.chain),
        fromAmount: value,
      });

      if (isEmpty(routes?.items)) return null;

      const bestRoute = routes.items.reduce((best: Route, route) => {
        if (!best?.toAmount || EthersBigNumber.from(best.toAmount).lt(route.toAmount)) return route;
        return best;
      });

      logBreadcrumb('buildCrossChainBridgeTransaction!', 'cross chain bridge routes', { routes });

      if (!bestRoute) return null;

      const { items: advanceRoutesTransactions } = await sdk.getStepTransaction({ route: bestRoute });

      if (isEmpty(advanceRoutesTransactions)) return null;

      const account = await sdk.computeContractAccount();

      let transactions = advanceRoutesTransactions.map((transaction) => {
        return {
          from: account.address,
          chainId: mapChainToChainId(fromAsset.chain),
          data: transaction.data,
          to: transaction.to,
          value: transaction.value,
        };
      });

      if (
        EthersUtils.isAddress(bestRoute.fromToken.address) &&
        !addressesEqual(bestRoute.fromToken.address, nativeAssetPerChain[fromAsset.chain].address) &&
        transactions.length === 1 &&
        bestRoute.fromAmount
      ) {
        const erc20Contract: any = this.getContract<?EtherspotErc20Interface>(
          fromAsset.chain,
          ERC20_CONTRACT_ABI,
          bestRoute.fromToken.address,
        );
        if (!erc20Contract) return { transactions, route: bestRoute };

        const approvalTransactionRequest = erc20Contract?.encodeApprove?.(transactions[0].to, bestRoute.fromAmount);
        if (!approvalTransactionRequest || !approvalTransactionRequest.to) {
          return { transactions, route: bestRoute };
        }

        const approvalTransaction = {
          to: approvalTransactionRequest.to,
          data: approvalTransactionRequest.data,
          value: '0',
          from: account.address,
          chainId: mapChainToChainId(fromAsset.chain),
        };

        transactions = [approvalTransaction, ...transactions];
      }

      return { transactions, route: bestRoute };
    } catch (e) {
      logBreadcrumb('buildCrossChainBridgeTransaction failed!', 'failed cross chain bridge routes', { e });
      return null;
    }
  }

  async getCrossChainBridgeTokenList(fromChain: Chain, supprotedChains: Chain[]) {
    const sdk = this.getSdkForChain(fromChain);
    if (!sdk) return null;

    try {
      const supprotedChainsList = supprotedChains.flatMap((chain) =>
        sdk.getCrossChainBridgeTokenList({
          // eslint-disable-next-line i18next/no-literal-string
          direction: 'To',
          fromChainId: mapChainToChainId(fromChain),
          toChainId: mapChainToChainId(chain),
        }),
      );

      const list = await Promise.all(supprotedChainsList);

      logBreadcrumb('getCrossChainBridgeTokenList', 'Get cross chain bridge supported list', {
        list,
        supprotedChainsList,
      });
      return list;
    } catch (e) {
      logBreadcrumb('getCrossChainBridgeTokenList Failed!', 'get error in supproted list cross chain', { e });
      return null;
    }
  }

  async supportedCrossChain() {
    try {
      const info: any = await this.sdk.getCrossChainBridgeSupportedChains();
      return info;
    } catch (e) {
      return e;
    }
  }

  async getGasPrice(chain: Chain): Promise<?GasPrice> {
    const sdk = this.getSdkForChain(chain);
    if (!sdk) return null;

    try {
      const { standard, fast, instant } = await sdk.getGatewayGasInfo();

      // maps from ethers.js BigNumber
      return {
        standard: new BigNumber(standard.toString()),
        fast: new BigNumber(fast.toString()),
        instant: new BigNumber(instant.toString()),
      };
    } catch (error) {
      reportErrorLog('EtherspotService getGasPrice failed', { chain, error });
      return null;
    }
  }

  getContract<T>(chain: Chain, abi: Object[], address: string): T | null {
    const sdk = this.getSdkForChain(chain);
    if (!sdk) return null;

    try {
      // contract name is for internal use, just to not pollute let's create contracts under chain-address
      return sdk.registerContract(`${chain}-${address}`, abi, address);
    } catch (error) {
      reportErrorLog('EtherspotService getExchangeOffers failed', { chain, error });
      return null;
    }
  }

  async getNftList(chain: Chain, address: string): NftList | null {
    const sdk = this.getSdkForChain(chain);

    if (!sdk) {
      logBreadcrumb('getNftList', 'EtherspotService getNftList getSdk failed', { chain });
      return null;
    }

    return sdk
      .getNftList({
        account: address,
      })
      .catch((error) => {
        reportErrorLog('EtherspotService getNftList failed', { chain, address, error });
        return null;
      });
  }

  async getTransaction(chain: Chain, hash: string): Promise<?EtherspotTransaction> {
    const sdk = this.getSdkForChain(chain);
    if (!sdk) return null;

    try {
      return sdk.getTransaction({ hash });
    } catch (error) {
      reportErrorLog('EtherspotService getTransaction failed', { chain, hash, error });
      return null;
    }
  }
}

const etherspot = new EtherspotService();

// this is for accounts unrelated Etherspot SDK usage
const etherspotSupportService = new EtherspotService();

export const getEtherspotSupportService = async (): Promise<EtherspotService> => {
  if (etherspotSupportService.sdk) return etherspotSupportService;

  const wallet = EthersWallet.createRandom();
  await etherspotSupportService.init(wallet.privateKey);

  return etherspotSupportService;
};

export default etherspot;

function networkNameFromChain(chain: Chain): ?string {
  switch (chain) {
    case CHAIN.ETHEREUM:
      return isProdEnv() ? NetworkNames.Mainnet : NetworkNames.Goerli;
    case CHAIN.BINANCE:
      return isProdEnv() ? NetworkNames.Bsc : NetworkNames.BscTest;
    case CHAIN.POLYGON:
      return isProdEnv() ? NetworkNames.Matic : NetworkNames.Mumbai;
    case CHAIN.XDAI:
      return isProdEnv() ? NetworkNames.Xdai : NetworkNames.Sokol;
    case CHAIN.OPTIMISM:
      return isProdEnv() ? NetworkNames.Optimism : NetworkNames.OptimismGoerli;
    case CHAIN.ARBITRUM:
      return isProdEnv() ? NetworkNames.Arbitrum : NetworkNames.ArbitrumNitro;
    default:
      return null;
  }
}

function chainFromNetworkName(networkName: string): ?Chain {
  switch (networkName) {
    case NetworkNames.Mainnet:
    case NetworkNames.Goerli:
      return CHAIN.ETHEREUM;
    case NetworkNames.Bsc:
    case NetworkNames.BscTest:
      return CHAIN.BINANCE;
    case NetworkNames.Matic:
    case NetworkNames.Mumbai:
      return CHAIN.POLYGON;
    case NetworkNames.Xdai:
    case NetworkNames.Sokol:
      return CHAIN.XDAI;
    case NetworkNames.Optimism:
    case NetworkNames.OptimismGoerli:
      return CHAIN.OPTIMISM;
    case NetworkNames.Arbitrum:
    case NetworkNames.ArbitrumNitro:
      return CHAIN.ARBITRUM;
    default:
      return null;
  }
}
