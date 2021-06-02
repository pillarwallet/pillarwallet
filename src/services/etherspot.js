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

import {
  constants as EthersConstants,
  utils as EthersUtils,
  Wallet as EthersWallet,
} from 'ethers';
import {
  Sdk as EtherspotSdk,
  NetworkNames,
  Account as EtherspotAccount,
  Accounts as EtherspotAccounts,
  EnvNames,
  ENSNode,
  GatewaySubmittedBatch,
  Notification as EtherspotNotification,
  IncreaseP2PPaymentChannelAmountDto,
  NotificationTypes,
  GatewayTransactionStates,
  Transaction as EtherspotTransaction,
  type AccountDashboard,
} from 'etherspot';
import { map } from 'rxjs/operators';
import type { Subscription } from 'rxjs';
import { getEnv } from 'configs/envConfig';
import t from 'translations/translate';

// utils
import {
  BigNumber,
  getEnsName,
  parseTokenAmount,
  reportErrorLog,
} from 'utils/common';
import { isProdEnv } from 'utils/environment';
import { addressesEqual } from 'utils/assets';
import { nativeSymbolPerChain } from 'utils/chains';
import { mapToEthereumTransactions } from 'utils/transactions';

// constants
import { ETH } from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';
import { LIQUIDITY_POOLS } from 'constants/liquidityPoolsConstants';

// types
import type { Asset, Assets } from 'models/Asset';
import type { Chain, ChainRecord } from 'models/Chain';
import type { EthereumTransaction, TransactionPayload, TransactionResult } from 'models/Transaction';
import type { EtherspotTransactionEstimate } from 'models/Etherspot';
import type { WalletAssetBalance } from 'models/Balances';

export class EtherspotService {
  sdk: EtherspotSdk;
  subscription: ?Subscription;
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
      isMainnet ? NetworkNames.Mainnet : NetworkNames.Kovan,
      NetworkNames.Bsc,
      NetworkNames.Matic,
      NetworkNames.Xdai,
    ];

    const primaryNetworkName = isMainnet ? NetworkNames.Mainnet : NetworkNames.Kovan;

    /**
     * Cycle through the supported networks and build an
     * array of instantiated instances
     */
    await Promise.all(this.supportedNetworks.map(async (networkName) => {
      const env = networkName !== NetworkNames.Kovan ? EnvNames.MainNets : EnvNames.TestNets;
      this.instances[networkName] = new EtherspotSdk(privateKey, { env, networkName });

      // FCM only for mainnet, session creation should happen before computing contract account
      if (fcmToken && networkName === primaryNetworkName) {
        try {
          await this.instances[networkName].createSession({ fcmToken });
        } catch (error) {
          reportErrorLog('EtherspotService network init failed at createSession', { networkName, error });
        }
      }

      try {
        await this.instances[networkName].computeContractAccount({ sync: true });
      } catch (error) {
        reportErrorLog('EtherspotService network init failed at computeContractAccount', { networkName, error });
      }
    }));

    // Assign the primary instance of the default networkName to `sdk`
    this.sdk = this.instances[primaryNetworkName];
  }

  subscribe(callback: (notification: EtherspotNotification) => Promise<void>) {
    if (!this.sdk) return;

    this.subscription = this.sdk.notifications$.pipe(map(callback)).subscribe();
  }

  unsubscribe() {
    if (!this.subscription) return;
    this.subscription.unsubscribe();
  }

  getSdkForChain(chain: Chain): ?EtherspotSdk {
    const network = networkNameFromChain(chain);
    if (!network) {
      reportErrorLog('EtherspotService getSdkForChain failed: no network', { chain });
      return null;
    }

    const sdk = this.instances[network];
    if (!sdk) {
      reportErrorLog('EtherspotService getSdkForChain failed: cannot get SDK instance', { chain, network });
      return null;
    }

    return sdk;
  }

  getAccount(chain: Chain, accountAddress: string): ?Promise<?EtherspotAccount> {
    const sdk = this.getSdkForChain(chain);
    if (!sdk) return null;

    return sdk.getAccount({ address: accountAddress }).catch((error) => {
      reportErrorLog('EtherspotService getAccount failed', { error });
      return null;
    });
  }

  async getAccountPerChains(accountAddress: string): Promise<ChainRecord<?EtherspotAccount>> {
    const ethereum = await this.getAccount(CHAIN.ETHEREUM, accountAddress);
    const binance = await this.getAccount(CHAIN.BINANCE, accountAddress);
    const polygon = await this.getAccount(CHAIN.POLYGON, accountAddress);
    const xdai = await this.getAccount(CHAIN.XDAI, accountAddress);

    return { ethereum, binance, polygon, xdai };
  }

  getAccounts(): Promise<?EtherspotAccount[]> {
    return this.sdk.getConnectedAccounts()
      .then(({ items }: EtherspotAccounts) => items)
      .catch((error) => {
        reportErrorLog('EtherspotService getAccounts -> getConnectedAccounts failed', { error });
        return null;
      });
  }

  async getBalances(
    chain: Chain,
    accountAddress: string,
    supportedAssets: Asset[],
  ): Promise<WalletAssetBalance[]> {
    const sdk = this.getSdkForChain(chain);
    if (!sdk) return [];

    const assetAddresses = supportedAssets
      // 0x0...0 is default native token address in our assets, but it's not a ERC20 token
      .filter(({ address }) => !addressesEqual(address, EthersConstants.AddressZero))
      .map(({ address }) => address);

    let balancesRequestPayload = {
      account: accountAddress,
    };

    if (assetAddresses.length) {
      balancesRequestPayload = {
        ...balancesRequestPayload,
        tokens: assetAddresses,
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

    const nativeSymbol = nativeSymbolPerChain[chain];

    return accountBalances.items.reduce((positiveBalances, asset) => {
      const { balance, token } = asset;

      const supportedAsset = supportedAssets.find(({
        symbol: supportedSymbol,
        address: supportedAddress,
      }) => {
        // `token === null` means it's chain native token
        if (token === null) return supportedSymbol === nativeSymbol;
        return addressesEqual(supportedAddress, token);
      });

      if (!supportedAsset) {
        reportErrorLog('EtherspotService getBalances asset mapping failed', {
          chain,
          token,
        });
        return positiveBalances;
      }

      const { decimals, symbol } = supportedAsset;

      const positiveBalance = EthersUtils.formatUnits(balance, decimals);

      // no need to return zero balance asset
      if (BigNumber(positiveBalance ?? 0).isZero()) {
        return positiveBalances;
      }

      return [
        ...positiveBalances,
        { symbol, balance: positiveBalance },
      ];
    }, []);
  }

  async getOwnedAssets(
    chain: Chain,
    accountAddress: string,
    supportedAssets: Asset[],
  ): Promise<Assets> {
    const balances = await this.getBalances(chain, accountAddress, supportedAssets);

    return balances.reduce((ownedAssets, { symbol }) => {
      const supportedAsset = supportedAssets.find((asset) => asset.symbol === symbol);

      if (supportedAsset) return { ...ownedAssets, [symbol]: supportedAsset };

      return ownedAssets;
    }, {});
  }

  reserveEnsName(username: string): Promise<?ENSNode> {
    const fullEnsName = getEnsName(username);
    return this.sdk.getAccountTokenListTokens({ name: fullEnsName }).catch((error) => {
      reportErrorLog('EtherspotService reserveENSName failed', { error, username, fullEnsName });
      return null;
    });
  }

  getEnsNode(nameOrHashOrAddress: string): Promise<?ENSNode> {
    return this.sdk.getENSNode({ nameOrHashOrAddress }).catch((error) => {
      reportErrorLog('getENSNode failed', { nameOrHashOrAddress, error });
      return null;
    });
  }

  clearTransactionsBatch() {
    return this.sdk.clearGatewayBatch();
  }

  setTransactionsBatch(transactions: EthereumTransaction[]) {
    return Promise.all(transactions.map((transaction) => this.sdk.batchExecuteAccountTransaction(transaction)));
  }

  estimateTransactionsBatch(useGasTokenAddress?: string): Promise<?$Shape<EtherspotTransactionEstimate>> {
    return this.sdk
      .estimateGatewayBatch({ refundToken: useGasTokenAddress })
      .then((result) => result?.estimation)
      .catch((error) => {
        let etherspotErrorMessage;
        try {
          // parsing etherspot estimate error based on return scheme
          const errorMessageJson = JSON.parse(error.message.trim());
          ([etherspotErrorMessage] = Object.values(errorMessageJson[0].constraints));
        } catch (e) {
          // unable to parse json
        }

        const errorMessage = etherspotErrorMessage || error?.message || t('error.unableToEstimateTransaction');
        reportErrorLog('estimateTransactionsBatch -> estimateGatewayBatch failed', { errorMessage });
        throw new Error(errorMessage);
      });
  }

  async setTransactionsBatchAndSend(
    transactions: EthereumTransaction[],
    useGasTokenAddress?: string,
  ): Promise<?TransactionResult> {
    // clear batch
    this.clearTransactionsBatch();

    // set batch
    await this.setTransactionsBatch(transactions).catch((error) => {
      reportErrorLog('setTransactionsBatchAndSend -> setTransactionsBatch failed', { error, transactions });
      throw error;
    });

    // estimate current batch
    await this.estimateTransactionsBatch(useGasTokenAddress);

    // submit current batch
    const { hash: batchHash } = await this.sdk.submitGatewayBatch();

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
    isP2P?: boolean,
  ): Promise<?TransactionResult> {
    if (isP2P) {
      // TODO: uncomment P2P partial implementation once it's available for Etherspot
      // return this.sendP2PTransaction(transaction);
    }

    const etherspotTransactions = await mapToEthereumTransactions(transaction, fromAccountAddress);

    return this.setTransactionsBatchAndSend(etherspotTransactions);
  }

  getSubmittedBatchByHash(hash: string): Promise<?GatewaySubmittedBatch> {
    return this.sdk.getGatewaySubmittedBatch({ hash }).catch((error) => {
      reportErrorLog('getSubmittedBatchByHash failed', { hash, error });
      return null;
    });
  }

  async getTransactionExplorerLinkByBatch(batchHash: string): Promise<?string> {
    const submittedBatch = await this.getSubmittedBatchByHash(batchHash);

    const transactionHash = submittedBatch?.transaction?.hash;
    if (!transactionHash) return null;

    return this.getTransactionExplorerLink(transactionHash);
  }

  getTransactionExplorerLink(transactionHash: string): string {
    return `${getEnv().TX_DETAILS_URL}${transactionHash}`;
  }

  waitForTransactionHashFromSubmittedBatch(batchHash: string): Promise<string> {
    let temporaryBatchSubscription;

    return new Promise((resolve, reject) => {
      temporaryBatchSubscription = this.sdk.notifications$
        .pipe(map(async (notification) => {
          if (notification.type === NotificationTypes.GatewayBatchUpdated) {
            const submittedBatch = await this.sdk.getGatewaySubmittedBatch({ hash: batchHash });

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
        }))
        .subscribe();
    });
  }

  getTransactionsByAddress(address: string): Promise<?(EtherspotTransaction[])> {
    return this.sdk
      .getTransactions({ account: address })
      .then(({ items }) => items)
      .catch((error) => {
        reportErrorLog('getTransactionsByAddress -> getTransactions failed', { address, error });
        return null;
      });
  }

  getDashboardData(accountAddress: string, currencySymbol: string, periodInDays: number): Promise<AccountDashboard> {
    return this.sdk
      .getAccountDashboard({
        account: accountAddress,
        currency: currencySymbol.toLowerCase(),
        days: periodInDays,
      })
      .catch((error) => {
        reportErrorLog('EtherspotService getDashboardData failed', { error });
        return null;
      });
  }

  async getSupportedAssets(): Promise<?Asset[]> {
    try {
      // eslint-disable-next-line i18next/no-literal-string
      const tokens = await this.sdk.getTokenListTokens();
      if (!tokens) {
        reportErrorLog('EtherspotService getSupportedAssets failed: no tokens returned');
        return null;
      }

      const supportedAssets = tokens.map(({
        address,
        name,
        symbol,
        decimals,
        logoURI,
      }) => ({
        symbol,
        name,
        address,
        decimals,
        iconUrl: logoURI,
        iconMonoUrl: logoURI,
      }));

      // add ETH if not within tokens list (most of the time since it's not a token)
      const supportedAssetsHaveEth = supportedAssets.some(({ symbol }) => symbol === ETH);
      if (!supportedAssetsHaveEth) {
        // eslint-disable-next-line i18next/no-literal-string
        const iconUrl = 'https://tokens.1inch.exchange/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png';
        supportedAssets.push({
          address: EthersConstants.AddressZero,
          name: 'Ethereum', // eslint-disable-line i18next/no-literal-string
          symbol: ETH,
          decimals: 18,
          iconUrl,
          iconMonoUrl: iconUrl,
        });
      }

      // add LP tokens from our own list, later this can be replaced with Etherspot list for LP tokens
      LIQUIDITY_POOLS().forEach(({
        uniswapPairAddress: address,
        name,
        symbol,
        iconUrl,
      }) => {
        supportedAssets.push({
          address,
          name,
          symbol,
          decimals: 18, // ref https://raw.githubusercontent.com/jab416171/uniswap-pairtokens/master/uniswap_pair_tokens.json
          iconUrl,
          iconMonoUrl: iconUrl,
        });
      });

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
      return isProdEnv() ? NetworkNames.Mainnet : NetworkNames.Kovan;
    case CHAIN.BINANCE:
      return NetworkNames.Bsc;
    case CHAIN.POLYGON:
      return NetworkNames.Matic;
    case CHAIN.XDAI:
      return NetworkNames.Xdai;
    default:
      return null;
  }
}
