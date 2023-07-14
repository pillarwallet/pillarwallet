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
import { isEmpty } from 'lodash';
import { toChecksumAddress } from '@netgum/utils';
import t from 'translations/translate';

// components
import Toast from 'components/Toast';

// constants
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import {
  ETH,
  ASSET_TYPES,
  ASSET_CATEGORY,
  SET_CHAIN_SUPPORTED_ASSETS,
  USD,
  ADD_TOKENS_FETCHING,
  ADD_TOKENS_LIST,
  ADD_CUSTOM_TOKEN,
} from 'constants/assetsConstants';
import {
  RESET_ACCOUNT_ASSETS_BALANCES,
  SET_ACCOUNT_ASSETS_BALANCES,
  SET_FETCHING_ASSETS_BALANCES,
} from 'constants/assetsBalancesConstants';
import { ADD_HISTORY_TRANSACTION, TX_CONFIRMED_STATUS, TX_PENDING_STATUS } from 'constants/historyConstants';
import { ADD_COLLECTIBLE_HISTORY_TRANSACTION, COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import { PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS } from 'constants/paymentNetworkConstants';
import { ERROR_TYPE } from 'constants/transactionsConstants';
import {
  SET_ACCOUNT_CATEGORY_CHAIN_TOTAL_BALANCE,
  SET_FETCHING_TOTAL_BALANCES,
  RESET_ACCOUNT_TOTAL_BALANCES,
} from 'constants/totalsBalancesConstants';
import { CHAIN } from 'constants/chainConstants';

// services
import etherspotService from 'services/etherspot';
import archanovaService from 'services/archanova';
import KeyBasedWallet from 'services/keyBasedWallet';

// utils
import { transformBalancesToObject, isTokenAvailableInList, isSameAsset } from 'utils/assets';
import {
  chainFromChainId,
  getSupportedChains,
  nativeAssetPerChain,
  isTestnetChainId,
  isMainnetChainId,
} from 'utils/chains';
import { BigNumber, parseTokenAmount, reportErrorLog, logBreadcrumb, fetchUrl } from 'utils/common';
import { buildHistoryTransaction, parseFeeWithGasToken } from 'utils/history';
import {
  getActiveAccount,
  getAccountAddress,
  getAccountId,
  isArchanovaAccount,
  isEtherspotAccount,
  getAccountType,
} from 'utils/accounts';
import { catchTransactionError } from 'utils/wallet';
import { wrapBigNumberOrNil } from 'utils/bigNumber';
import {
  assetsCategoryFromEtherspotBalancesCategory,
  parseTokenListToken,
  filteredWithDefaultAssets,
} from 'utils/etherspot';
import { isProdEnv } from 'utils/environment';
import PolygonTokens from 'utils/tokens/polygon-tokens';
import MumbaiTokens from 'utils/tokens/mumbai-tokens';
import EthereumTokens from 'utils/tokens/ethereum-tokens';
import EthereumGoerliTokens from 'utils/tokens/ethereum-goerli-tokens.json';
import BinanceTestnetTokens from 'utils/tokens/binance-testnet-tokens.json';
import BinanceTokens from 'utils/tokens/binance-tokens';
import OptimismGoerliTokens from 'utils/tokens/optimism-goerli-tokens.json';
import OptimismTokens from 'utils/tokens/optimism-tokens';
import ArbitrumTokens from 'utils/tokens/arbitrum-tokens';
import XdaiTokens from 'utils/tokens/xdai-tokens';
import DefaultTokens from 'utils/tokens/tokens.json';
import DefaultStableTokens from 'utils/tokens/stable-tokens.json';

// selectors
import {
  accountsSelector,
  activeAccountSelector,
  supportedAssetsPerChainSelector,
  addTokensListSelector,
  customTokensListSelector,
} from 'selectors';
import { accountCollectiblesSelector } from 'selectors/collectibles';

// types
import type { Account } from 'models/Account';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { TransactionPayload, TransactionResult, TransactionStatus } from 'models/Transaction';
import type { WalletAssetsBalances } from 'models/Balances';
import type { Chain } from 'models/Chain';
import type { Asset, AddTokensItem } from 'models/Asset';

// actions
import { saveDbAction } from './dbActions';
import { fetchCollectiblesAction } from './collectiblesActions';
import { fetchVirtualAccountBalanceAction } from './smartWalletActions';
import { fetchAssetsRatesAction } from './ratesActions';
import { addEnsRegistryRecordAction } from './ensRegistryActions';

export const sendENSTransactionAction = (
  callback: (status: TransactionStatus) => void,
  waitForActualTransactionHash: boolean = false,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    logBreadcrumb('Send Flow', 'sendENSTransactionAction: checking for active account');
    const activeAccount = activeAccountSelector(getState());
    if (!activeAccount) {
      logBreadcrumb('sendENSTransactionAction', 'failed: no active account');
      return;
    }

    let transactionResult: ?TransactionResult;
    let transactionErrorMessage: ?string;
    if (isEtherspotAccount(activeAccount)) {
      try {
        transactionResult = await etherspotService.sendENSTransaction(CHAIN.ETHEREUM);
      } catch (error) {
        reportErrorLog('Send Flow:- sendENSTransactionAction transaction failed', {
          error,
        });
        transactionErrorMessage = error;
      }
    }

    if (!transactionResult || transactionErrorMessage) {
      logBreadcrumb('Send Flow', 'sendENSTransactionAction: transaction failed', { error: transactionErrorMessage });
      callback({
        isSuccess: false,
        error: transactionErrorMessage || t('error.transactionFailed.default'),
      });
      return;
    }

    let transactionHash = transactionResult?.hash;
    const transactionBatchHash = transactionResult?.batchHash;

    if (isEtherspotAccount(activeAccount) && waitForActualTransactionHash && !transactionHash && transactionBatchHash) {
      try {
        logBreadcrumb('Send Flow', 'sendENSTransactionAction: etherspot account fetching transaction hash', {
          batchHash: transactionBatchHash,
        });
        transactionHash = await etherspotService.waitForTransactionHashFromSubmittedBatch(
          CHAIN.ETHEREUM,
          transactionBatchHash,
        );
      } catch (error) {
        reportErrorLog('Exception in wallet transaction: waitForTransactionHashFromSubmittedBatch failed', { error });
      }
    }

    if (!transactionHash && !transactionBatchHash) {
      logBreadcrumb(
        'Send Flow',
        'sendENSTransactionAction: transaction failed as transactionHash and transactionBatchHash is not available',
      );
      callback({
        isSuccess: false,
        error: t('error.transactionFailed.default'),
      });
      return;
    }

    logBreadcrumb('Send Flow', 'sendAssetAction transaction sent', { transactionHash, transactionBatchHash });
    callback({
      isSuccess: true,
      error: null,
      hash: transactionHash,
      batchHash: transactionBatchHash,
    });
  };
};

export const sendAssetAction = (
  transaction: TransactionPayload,
  privateKey: string,
  callback: (status: TransactionStatus) => void,
  waitForActualTransactionHash: boolean = false,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      tokenType,
      symbol,
      usePPN = false,
      receiverEnsName,
      gasToken,
      txFeeInWei,
      chain = CHAIN.ETHEREUM,
      contractAddress,
    } = transaction;

    const to = toChecksumAddress(transaction.to);
    const isCollectibleTransaction = tokenType === ASSET_TYPES.COLLECTIBLE;

    // used for logging purpose omnly
    let logTransactionType;

    // fetch latest
    if (isCollectibleTransaction) {
      logTransactionType = 'ERC721'; // eslint-disable-line i18next/no-literal-string
      logBreadcrumb('Send Flow', 'sendAssetAction: collectible transaction dispatching fetchCollectiblesAction', {
        type: logTransactionType,
      });
      await dispatch(fetchCollectiblesAction());
    } else {
      logTransactionType = symbol === ETH ? 'ETH' : 'ERC20'; // eslint-disable-line i18next/no-literal-string
    }

    logBreadcrumb('Send Flow', 'sendAssetAction: checking for active account');
    const activeAccount = activeAccountSelector(getState());
    if (!activeAccount) {
      logBreadcrumb('sendAssetAction', 'failed: no active account');
      return;
    }

    const accountId = getAccountId(activeAccount);
    const accountAddress = getAccountAddress(activeAccount);

    const accountCollectiblesOnChain = accountCollectiblesSelector(getState())?.[chain] ?? [];

    let collectibleInfo;
    if (isCollectibleTransaction) {
      logBreadcrumb('Send Flow', 'sendAssetAction: collectible transaction fetching collectibleInfo', {
        chain,
        collectibles: accountCollectiblesOnChain,
      });
      collectibleInfo = accountCollectiblesOnChain.find((item) => item.id === transaction.tokenId);
      if (!collectibleInfo) {
        logBreadcrumb('Send Flow', 'sendAssetAction: failed to fetch collectibleInfo, ERROR_TYPE.NOT_OWNED');
        callback({
          isSuccess: false,
          error: ERROR_TYPE.NOT_OWNED,
          noRetry: true,
        });
        return;
      }
    }

    logBreadcrumb('Send Flow', 'sendAssetAction: building fee with gas token if present');
    // build fee with gas token if present
    const feeWithGasToken = !isEmpty(gasToken) ? parseFeeWithGasToken(gasToken, txFeeInWei) : null;

    let transactionResult: ?TransactionResult;
    let transactionErrorMessage: ?string;

    try {
      switch (getAccountType(activeAccount)) {
        case ACCOUNT_TYPES.KEY_BASED:
          logBreadcrumb('Send Flow', 'sendAssetAction: account type: key based wallet sending transaction', {
            transaction,
            accountAddress,
            chain,
          });
          const keyBasedWallet = new KeyBasedWallet(privateKey);
          const {
            transactionEstimate: { feeInfo },
          } = getState();
          transactionResult = await keyBasedWallet.sendTransaction(transaction, accountAddress, feeInfo);
          break;
        case ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET:
          logBreadcrumb('Send Flow', 'sendAssetAction: account type: archanova smart wallet sending transaction', {
            transaction,
            accountAddress,
            usePPN,
          });
          transactionResult = await archanovaService.sendTransaction(transaction, accountAddress, usePPN);
          break;
        case ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET:
          logBreadcrumb('Send Flow', 'sendAssetAction: account type: etherspot smart wallet sending transaction', {
            transaction,
            accountAddress,
            chain,
            usePPN,
          });
          transactionResult = await etherspotService.sendTransaction(transaction, accountAddress, chain, usePPN);
          break;
        default:
          break;
      }
    } catch (error) {
      reportErrorLog('Send Flow:- sendAssetAction transaction failed', {
        error,
        type: logTransactionType,
        transaction,
      });
      ({ error: transactionErrorMessage } = catchTransactionError(error, logTransactionType, transaction));
    }

    if (!transactionResult || transactionErrorMessage) {
      logBreadcrumb('Send Flow', 'sendAssetAction: transaction failed', { error: transactionErrorMessage });
      callback({
        isSuccess: false,
        error: transactionErrorMessage || t('error.transactionFailed.default'),
      });
      return;
    }

    let transactionHash = transactionResult?.hash;
    const transactionBatchHash = transactionResult?.batchHash;

    /**
     * This (waitForTransactionHashFromSubmittedBatch) covers edge case for WalletConnect alone,
     * but might be used for other scenarios where transaction hash is needed on submit callback.
     *
     * If transaction is sent through Etherspot then transaction will be submitted asynchronously
     * along with batch which won't provide actual transaction hash instantaneously.
     *
     * WalletConnect approve request expects actual transaction hash to be sent back to Dapp
     * for it to track the status of it or etc. on Dapp side.
     *
     * The only approach here that makes sense is to subscribe for submitted batch updates
     * by its hash and hold callback until we get the actual transaction hash
     * which we can send back to Dapp and provide seamless experience on both sides.
     *
     * How long batch takes to proceed? According to Etherspot team there are 4 nodes working
     * with transactions and this number can be increased if batches are queuing for longer times.
     */
    if (isEtherspotAccount(activeAccount) && waitForActualTransactionHash && !transactionHash && transactionBatchHash) {
      try {
        logBreadcrumb('Send Flow', 'sendAssetAction: etherspot account fetching transaction hash', {
          chain,
          batchHash: transactionBatchHash,
        });
        transactionHash = await etherspotService.waitForTransactionHashFromSubmittedBatch(chain, transactionBatchHash);
      } catch (error) {
        reportErrorLog('Exception in wallet transaction: waitForTransactionHashFromSubmittedBatch failed', { error });
      }
    }

    if (!transactionHash && !transactionBatchHash) {
      logBreadcrumb(
        'Send Flow',
        'sendAssetAction: transaction failed as transactionHash and transactionBatchHash is not available',
      );
      callback({
        isSuccess: false,
        error: t('error.transactionFailed.default'),
      });
      return;
    }

    const transactionValue =
      !isCollectibleTransaction && transaction.amount ? parseTokenAmount(transaction.amount, transaction.decimals) : 0;

    logBreadcrumb('Send Flow', 'sendAssetAction: buildHistoryTransaction');
    let historyTx = buildHistoryTransaction({
      ...transactionResult,
      to,
      hash: transactionHash,
      batchHash: transactionBatchHash,
      from: accountAddress,
      // $FlowFixMe: either will be present
      assetSymbol: isCollectibleTransaction ? transaction.name : symbol,
      assetAddress: contractAddress ?? nativeAssetPerChain[chain].address,
      gasPrice: transaction.gasPrice,
      gasLimit: transaction.gasLimit,
      gasUsed: transaction.gasUsed,
      isPPNTransaction: !!usePPN,
      status: usePPN ? TX_CONFIRMED_STATUS : TX_PENDING_STATUS,
      value: transactionValue,
      feeWithGasToken,
    });

    if (transaction.extra) {
      historyTx = {
        ...historyTx,
        extra: transaction.extra,
      };
    }

    if (transaction.tag) {
      historyTx = {
        ...historyTx,
      };
    }

    if (isCollectibleTransaction) {
      historyTx = {
        ...historyTx,
        type: COLLECTIBLE_TRANSACTION,
        icon: collectibleInfo?.icon,
        assetData: collectibleInfo,
      };
    }

    if (isArchanovaAccount(activeAccount) && !usePPN && transactionHash) {
      logBreadcrumb(
        'Send Flow',
        'sendAssetAction: archanova account:- dispatching PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS ',
        { hash: transactionHash },
      );
      dispatch({ type: PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS, payload: transactionHash });
    }

    // update transaction history
    if (isCollectibleTransaction) {
      const { tokenId } = transaction;
      logBreadcrumb(
        'Send Flow',
        'sendAssetAction: collectible transaction:- dispatching ADD_COLLECTIBLE_HISTORY_TRANSACTION ',
        { historyTx, tokenId, contractAddress, accountId, chain },
      );
      dispatch({
        type: ADD_COLLECTIBLE_HISTORY_TRANSACTION,
        payload: {
          transaction: historyTx,
          tokenId,
          contractAddress,
          accountId,
          chain,
        },
      });

      const {
        collectibles: { data: updatedCollectibles, transactionHistory: updatedCollectiblesHistory },
      } = getState();

      logBreadcrumb(
        'Send Flow',
        'sendAssetAction: collectible transaction:- dispatching saveDbAction to update collectibe transaction history',
      );
      dispatch(saveDbAction('collectiblesHistory', { collectiblesHistory: updatedCollectiblesHistory }, true));
      dispatch(saveDbAction('collectibles', { collectibles: updatedCollectibles }, true));
    } else {
      logBreadcrumb('Send Flow', 'sendAssetAction: dispatching ADD_HISTORY_TRANSACTION', {
        accountId,
        historyTx,
        chain,
      });
      dispatch({
        type: ADD_HISTORY_TRANSACTION,
        payload: {
          accountId,
          transaction: historyTx,
          chain,
        },
      });
      const {
        history: { data: updatedHistory },
      } = getState();
      logBreadcrumb('Send Flow', 'sendAssetAction: dispatching saveDbAction to update transaction history');
      dispatch(saveDbAction('history', { history: updatedHistory }, true));
    }

    if (receiverEnsName) {
      logBreadcrumb('Send Flow', 'sendAssetAction: receiverENSName available dispatching addEnsRegistryRecordAction', {
        to,
        receiverEnsName,
      });
      dispatch(addEnsRegistryRecordAction(to, receiverEnsName));
    }

    logBreadcrumb('Send Flow', 'sendAssetAction transaction sent', { transactionHash, transactionBatchHash });
    callback({
      isSuccess: true,
      error: null,
      hash: transactionHash,
      batchHash: transactionBatchHash,
    });
  };
};

export const updateAccountWalletAssetsBalancesForChainAction = (
  accountId: string,
  chain: Chain,
  balances: WalletAssetsBalances,
) => {
  return (dispatch: Dispatch, getState: GetState) => {
    dispatch({
      type: SET_ACCOUNT_ASSETS_BALANCES,
      payload: {
        accountId,
        balances,
        chain,
        category: ASSET_CATEGORY.WALLET,
      },
    });

    const updatedBalances = getState().assetsBalances.data;
    dispatch(saveDbAction('assetsBalances', { data: updatedBalances }, true));
  };
};

export const fetchAccountWalletBalancesAction = (account: Account) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const walletAddress = getAccountAddress(account);
    const accountId = getAccountId(account);
    if (!walletAddress || !accountId) return;

    const chains = getSupportedChains(account);
    const supportedAssetsPerChain = supportedAssetsPerChainSelector(getState());

    await Promise.all(
      chains.map(async (chain) => {
        let newBalances = [];
        try {
          const chainSupportedAssets = supportedAssetsPerChain[chain] ?? [];
          newBalances = await etherspotService.getBalances(chain, walletAddress, chainSupportedAssets);
        } catch (error) {
          reportErrorLog('fetchAccountWalletBalancesAction failed to fetch chain balances', {
            accountId,
            accountType: account.type,
            chain,
          });
        }

        if (isEmpty(newBalances)) return;

        await dispatch(
          updateAccountWalletAssetsBalancesForChainAction(accountId, chain, transformBalancesToObject(newBalances)),
        );
      }),
    );

    const accountsTotalBalances = getState().totalBalances.data;
    dispatch(saveDbAction('totalBalances', { data: accountsTotalBalances }, true));
  };
};

export const fetchAllAccountsTotalBalancesAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (getState().totalBalances.isFetching) return;

    dispatch({ type: SET_FETCHING_TOTAL_BALANCES, payload: true });

    const accounts = accountsSelector(getState());

    await Promise.all(
      accounts.map(async (account) => {
        dispatch(fetchCollectiblesAction(account));

        const accountId = getAccountId(account);
        const accountAddress = getAccountAddress(account);

        // we're fetching and storing values in USD and converting rates by app selected currency later
        const accountTotalBalances = await etherspotService.getAccountTotalBalances(accountAddress, USD);
        if (!accountTotalBalances) return;

        accountTotalBalances.forEach(({ balances, category: balancesCategory, chainId, totalBalance }) => {
          const chain = chainFromChainId[chainId];
          const assetsCategory = assetsCategoryFromEtherspotBalancesCategory[balancesCategory];
          if (!assetsCategory) {
            logBreadcrumb(
              'fetchAllAccountsTotalBalancesAction',
              'Cannot map Etherspot balances category into assets category',
              { balancesCategory },
            );
            return;
          }

          const mappedBalances = balances.map(
            ({ key, title, serviceTitle, address, iconUrl, share, value: valueInUsd }) => ({
              key,
              service: serviceTitle,
              title,
              address,
              iconUrl,
              share: wrapBigNumberOrNil(share),
              valueInUsd: BigNumber(valueInUsd),
            }),
          );

          dispatch({
            type: SET_ACCOUNT_ASSETS_BALANCES,
            payload: {
              accountId,
              chain,
              category: assetsCategory,
              balances: mappedBalances,
            },
          });

          dispatch({
            type: SET_ACCOUNT_CATEGORY_CHAIN_TOTAL_BALANCE,
            payload: {
              accountId,
              category: assetsCategory,
              chain,
              balance: totalBalance,
            },
          });
        });
      }),
    );

    dispatch({ type: SET_FETCHING_TOTAL_BALANCES, payload: false });

    const accountsTotalBalances = getState().totalBalances.data;
    dispatch(saveDbAction('totalBalances', { data: accountsTotalBalances }, true));

    const assetsBalancesPerAccount = getState().assetsBalances.data;
    dispatch(saveDbAction('assetsBalances', { data: assetsBalancesPerAccount }, true));
  };
};

export const fetchAssetsBalancesAction = (isRefreshingPart?: boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      assetsBalances: { isFetching },
      session: {
        data: { isOnline },
      },
    } = getState();

    const activeAccount = getActiveAccount(accounts);
    if (!activeAccount || isFetching || !isOnline) return;

    dispatch({ type: SET_FETCHING_ASSETS_BALANCES, payload: true });

    if (!isRefreshingPart) {
      dispatch(fetchSupportedAssetsAction());
    }

    dispatch(fetchAccountWalletBalancesAction(activeAccount));

    if (isArchanovaAccount(activeAccount)) {
      dispatch(fetchVirtualAccountBalanceAction());
    }

    dispatch({ type: SET_FETCHING_ASSETS_BALANCES, payload: false });
  };
};

export const resetAccountAssetsBalancesAction = (accountId: string) => {
  return (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: RESET_ACCOUNT_ASSETS_BALANCES, payload: accountId });
    dispatch({ type: RESET_ACCOUNT_TOTAL_BALANCES, payload: accountId });

    const assetsBalancesPerAccount = getState().assetsBalances.data;
    dispatch(saveDbAction('assetsBalances', { data: assetsBalancesPerAccount }, true));

    const updatedTotalBalances = getState().totalBalances.data;
    dispatch(saveDbAction('totalBalances', { data: updatedTotalBalances }, true));
  };
};

export const fetchAllAccountsAssetsBalancesAction = (isRefreshingPart?: boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      assetsBalances: { isFetching },
      accounts: { data: accounts },
      session: {
        data: { isOnline },
      },
    } = getState();

    const activeAccount = getActiveAccount(accounts);
    if (!activeAccount || isFetching || !isOnline) return;

    dispatch({ type: SET_FETCHING_ASSETS_BALANCES, payload: true });

    if (!isRefreshingPart) {
      await dispatch(fetchSupportedAssetsAction());
    }

    const promises = accounts.map((account) => dispatch(fetchAccountWalletBalancesAction(account)));

    await Promise.all(promises).catch((error) =>
      reportErrorLog('fetchAllAccountsAssetsBalancesAction failed', { error }),
    );

    dispatch(fetchAssetsRatesAction());

    if (isArchanovaAccount(activeAccount)) {
      dispatch(fetchVirtualAccountBalanceAction());
    }

    dispatch({ type: SET_FETCHING_ASSETS_BALANCES, payload: false });
  };
};

export const fetchSupportedAssetsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      session: {
        data: { isOnline },
      },
    } = getState();

    // nothing to do if offline
    if (!isOnline) return;

    const customTokensList = customTokensListSelector(getState());

    await Promise.all(
      Object.keys(CHAIN).map(async (chainKey) => {
        const chain = CHAIN[chainKey];
        const chainSupportedAssets = await etherspotService.getSupportedAssets(chain);
        const defaultTokens = DefaultTokens.concat(DefaultStableTokens);

        // nothing to do if returned empty
        if (isEmpty(chainSupportedAssets)) return;

        const filteredCustomAssets = filteredWithDefaultAssets(chainSupportedAssets, customTokensList, chain);

        let totalSupportedAssets = [...chainSupportedAssets, ...filteredCustomAssets];

        const filteredDefaultAssets = filteredWithDefaultAssets(totalSupportedAssets, defaultTokens, chain);

        totalSupportedAssets = [...totalSupportedAssets, ...filteredDefaultAssets];

        dispatch({
          type: SET_CHAIN_SUPPORTED_ASSETS,
          payload: { chain, assets: totalSupportedAssets },
        });
      }),
    );

    const updatedSupportedAssets = supportedAssetsPerChainSelector(getState());
    dispatch(saveDbAction('supportedAssets', { supportedAssets: updatedSupportedAssets }, true));
  };
};

export const fetchOfflineLocalAssets = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    await Promise.all(
      Object.keys(CHAIN).map(async (chainKey) => {
        const chain = CHAIN[chainKey];

        const chainSupportedAssets = localAssets(chain);

        dispatch({
          type: SET_CHAIN_SUPPORTED_ASSETS,
          payload: { chain, assets: chainSupportedAssets },
        });
      }),
    );

    const updatedSupportedAssets = supportedAssetsPerChainSelector(getState());
    dispatch(saveDbAction('supportedAssets', { supportedAssets: updatedSupportedAssets }, true));
  };
};

export const localAssets = (chain: Chain) => {
  const isMainnet = isProdEnv();
  if (chain === CHAIN.POLYGON) {
    return isMainnet ? PolygonTokens : MumbaiTokens;
  }
  if (chain === CHAIN.ETHEREUM) {
    return isMainnet ? EthereumTokens : EthereumGoerliTokens;
  }
  if (chain === CHAIN.BINANCE) {
    return isMainnet ? BinanceTokens : BinanceTestnetTokens;
  }
  if (chain === CHAIN.XDAI) {
    return XdaiTokens;
  }
  if (chain === CHAIN.OPTIMISM) {
    return isMainnet ? OptimismTokens : OptimismGoerliTokens;
  }
  if (chain === CHAIN.ARBITRUM) {
    return isMainnet ? ArbitrumTokens : [];
  }
  return [];
};

export const addTokensListAction = (tokenInfo: AddTokensItem) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      session: {
        data: { isOnline },
      },
      addTokensList: { isFetching },
    } = getState();

    const isMainnet = isProdEnv();

    // nothing to do if offline
    if (!isOnline || isFetching) return;

    dispatch({ type: ADD_TOKENS_FETCHING, payload: true });

    const { addTokensList } = addTokensListSelector(getState());

    const tokenIndex = addTokensList.findIndex((obj) => obj.chain === tokenInfo.chain && obj.name === tokenInfo.name);

    try {
      const res = await fetchUrl(tokenInfo.link);
      const jsonResponse = await res.json();

      if (!res || res?.status !== 200 || !jsonResponse) {
        Toast.show({
          message: t('error.fetchTokenListFailed'),
          emoji: 'hushed',
        });
        dispatch({ type: ADD_TOKENS_FETCHING, payload: false });
        return;
      }

      let tokens = jsonResponse.tokens
        ?.filter((token) => (isMainnet ? isMainnetChainId(token.chainId) : isTestnetChainId(token.chainId)))
        ?.map((token) => parseTokenListToken(token));

      dispatch({ type: ADD_TOKENS_FETCHING, payload: false });

      if (isEmpty(tokens)) return;

      if (tokenInfo.chain === CHAIN.OPTIMISM && jsonResponse.name === 'Optimism') {
        tokens = tokens.filter((token) => token.chain === CHAIN.OPTIMISM);
      }

      const supportedChains = [];
      tokens.forEach((token) => {
        if (!supportedChains.includes(token.chain)) {
          supportedChains.push(token.chain);
        }
      });

      const token = { chain: tokenInfo.chain, ...jsonResponse, tokens, supportedChains };

      let newTokenList = [...addTokensList];
      if (tokenIndex !== -1) {
        newTokenList[tokenIndex] = token;
      } else {
        newTokenList = [...newTokenList, token];
      }

      dispatch({
        type: ADD_TOKENS_LIST,
        payload: newTokenList,
      });

      dispatch(saveDbAction('addTokensList', { addTokensList: newTokenList }, true));
    } catch (error) {
      reportErrorLog('AddTokensList failed', { error });
    }
  };
};

export const manageCustomTokens = (token: Asset, isCustomTokenImport?: boolean) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      customTokensList: { data },
    } = getState();

    const isTokenAvailable = isTokenAvailableInList(data, token);

    if (isTokenAvailable && isCustomTokenImport) {
      Toast.show({
        message: t('label.tokenExists'),
        emoji: 'eyes',
      });
      return;
    }

    if (isTokenAvailable) {
      const filteredTokensList = data.filter((tokenA) => !isSameAsset(token, tokenA));
      dispatch({ type: ADD_CUSTOM_TOKEN, payload: filteredTokensList });
    } else {
      if (isCustomTokenImport) {
        Toast.show({
          message: t('label.addedCustomToken'),
          emoji: 'ok_hand',
        });
      }
      const arr = [...data];
      const newTokensList = isEmpty(arr) ? [token] : arr.concat([token]);
      dispatch({ type: ADD_CUSTOM_TOKEN, payload: newTokensList });
    }

    const customTokensList = customTokensListSelector(getState());

    dispatch(saveDbAction('customTokensList', { customTokensList }, true));

    setTimeout(() => {
      dispatch(fetchSupportedAssetsAction());
    }, 1000);
  };
};
