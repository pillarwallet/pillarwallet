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

// constants
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { ETH, COLLECTIBLES, ASSET_CATEGORY, SET_CHAIN_SUPPORTED_ASSETS, USD } from 'constants/assetsConstants';
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

// utils
import { transformBalancesToObject } from 'utils/assets';
import { chainFromChainId, getSupportedChains } from 'utils/chains';
import { BigNumber, parseTokenAmount, reportErrorLog } from 'utils/common';
import { buildHistoryTransaction, parseFeeWithGasToken } from 'utils/history';
import {
  getActiveAccount,
  getAccountAddress,
  getAccountId,
  isNotKeyBasedType,
  isArchanovaAccount,
  isEtherspotAccount,
  getAccountType,
} from 'utils/accounts';
import { catchTransactionError } from 'utils/wallet';
import { wrapBigNumberOrNil } from 'utils/bigNumber';
import { assetsCategoryFromEtherspotBalancesCategory } from 'utils/etherspot';

// selectors
import { accountsSelector, supportedAssetsPerChainSelector } from 'selectors';

// types
import type { Account } from 'models/Account';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { TransactionPayload, TransactionResult, TransactionStatus } from 'models/Transaction';
import type { WalletAssetsBalances } from 'models/Balances';
import type { Chain } from 'models/Chain';

// actions
import { saveDbAction } from './dbActions';
import { fetchCollectiblesAction } from './collectiblesActions';
import { fetchVirtualAccountBalanceAction } from './smartWalletActions';
import { fetchAssetsRatesAction } from './ratesActions';
import { addEnsRegistryRecordAction } from './ensRegistryActions';


export const sendAssetAction = (
  transaction: TransactionPayload,
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
    } = transaction;

    const to = toChecksumAddress(transaction.to);
    const isCollectibleTransaction = tokenType === COLLECTIBLES;

    // used for logging purpose omnly
    let logTransactionType;

    // fetch latest
    if (isCollectibleTransaction) {
      logTransactionType = 'ERC721'; // eslint-disable-line i18next/no-literal-string
      await dispatch(fetchCollectiblesAction());
    } else {
      logTransactionType = symbol === ETH ? 'ETH' : 'ERC20'; // eslint-disable-line i18next/no-literal-string
    }

    const {
      accounts: { data: accounts },
      collectibles: { data: collectibles },
    } = getState();

    const activeAccount = getActiveAccount(accounts);

    if (!activeAccount) {
      reportErrorLog('sendAssetAction failed: no active account');
      return;
    }

    const accountId = getAccountId(activeAccount);
    const accountAddress = getAccountAddress(activeAccount);

    const accountCollectibles = collectibles[accountId] || [];

    let collectibleInfo;
    if (isCollectibleTransaction) {
      collectibleInfo = accountCollectibles.find(item => item.id === transaction.tokenId);
      if (!collectibleInfo) {
        callback({
          isSuccess: false,
          error: ERROR_TYPE.NOT_OWNED,
          noRetry: true,
        });
        return;
      }
    }

    // build fee with gas token if present
    const feeWithGasToken = !isEmpty(gasToken)
      ? parseFeeWithGasToken(gasToken, txFeeInWei)
      : null;


    let transactionResult: ?TransactionResult;
    let transactionErrorMessage: ?string;

    try {
      switch (getAccountType(activeAccount)) {
        case ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET:
          transactionResult = await archanovaService.sendTransaction(transaction, accountAddress, usePPN);
          break;
        case ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET:
          transactionResult = await etherspotService.sendTransaction(transaction, accountAddress, chain, usePPN);
          break;
        default:
          break;
      }
    } catch (error) {
      ({ error: transactionErrorMessage } = catchTransactionError(error, logTransactionType, transaction));
    }

    if (!transactionResult || transactionErrorMessage) {
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
    if (isEtherspotAccount(activeAccount)
      && waitForActualTransactionHash
      && !transactionHash
      && transactionBatchHash) {
      try {
        transactionHash = await etherspotService.waitForTransactionHashFromSubmittedBatch(chain, transactionBatchHash);
      } catch (error) {
        reportErrorLog('Exception in wallet transaction: waitForTransactionHashFromSubmittedBatch failed', { error });
      }
    }

    if (!transactionHash && !transactionBatchHash) {
      callback({
        isSuccess: false,
        error: t('error.transactionFailed.default'),
      });
      return;
    }

    const transactionValue = !isCollectibleTransaction && transaction.amount
      ? parseTokenAmount(transaction.amount, transaction.decimals)
      : 0;

    let historyTx = buildHistoryTransaction({
      ...transactionResult,
      to,
      hash: transactionHash,
      batchHash: transactionBatchHash,
      from: accountAddress,
      // $FlowFixMe: either will be present
      asset: isCollectibleTransaction ? transaction.name : symbol,
      gasPrice: transaction.gasPrice,
      gasLimit: transaction.gasLimit,
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
      dispatch({ type: PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS, payload: transactionHash });
    }

    // update transaction history
    if (isCollectibleTransaction) {
      const { contractAddress, tokenId } = transaction;
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
        collectibles: {
          data: updatedCollectibles,
          transactionHistory: updatedCollectiblesHistory,
        },
      } = getState();

      dispatch(saveDbAction('collectiblesHistory', { collectiblesHistory: updatedCollectiblesHistory }, true));
      dispatch(saveDbAction('collectibles', { collectibles: updatedCollectibles }, true));
    } else {
      dispatch({
        type: ADD_HISTORY_TRANSACTION,
        payload: {
          accountId,
          transaction: historyTx,
          chain,
        },
      });
      const { history: { data: updatedHistory } } = getState();
      dispatch(saveDbAction('history', { history: updatedHistory }, true));
    }

    if (receiverEnsName) {
      dispatch(addEnsRegistryRecordAction(to, receiverEnsName));
    }

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

    await Promise.all(chains.map(async (chain) => {
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
    }));

    const accountsTotalBalances = getState().totalBalances.data;
    dispatch(saveDbAction('totalBalances', { data: accountsTotalBalances }, true));
  };
};

/**
 * Note: Per current moment of implementation it's not needed to
 * separate this per single account action because we would even
 * need to double the requests from Zapper as they allow to query
 * for multiple addresses and response time does not increase significantly.
 */
export const fetchAllAccountsTotalBalancesAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (getState().totalBalances.isFetching) return;

    dispatch({ type: SET_FETCHING_TOTAL_BALANCES, payload: true });

    const accounts = accountsSelector(getState());
    const smartWalletAccounts = accounts.filter(isNotKeyBasedType);

    await Promise.all(smartWalletAccounts.map(async (account) => {
      dispatch(fetchCollectiblesAction(account));

      const accountId = getAccountId(account);
      const accountAddress = getAccountAddress(account);

      // we're fetching and storing values in USD and converting rates by app selected currency later
      const accountTotalBalances = await etherspotService.getAccountTotalBalances(accountAddress, USD);
      if (!accountTotalBalances) return;

      accountTotalBalances.forEach(({
        balances,
        category: balancesCategory,
        chainId,
        totalBalance,
      }) => {
        const chain = chainFromChainId[chainId];
        const assetsCategory = assetsCategoryFromEtherspotBalancesCategory[balancesCategory];
        if (!assetsCategory) {
          reportErrorLog('Cannot map Etherspot balances category into assets category', { balancesCategory });
          return;
        }

        const mappedBalances = balances.map(({
          key,
          title,
          serviceTitle,
          iconUrl,
          share,
          value: valueInUsd,
        }) => ({
          key,
          service: serviceTitle,
          title,
          iconUrl,
          share: wrapBigNumberOrNil(share),
          valueInUsd: BigNumber(valueInUsd),
        }));

        dispatch({
          type: SET_ACCOUNT_ASSETS_BALANCES,
          payload: {
            accountId,
            chain,
            category: assetsCategory,
            balances: BigNumber(mappedBalances),
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
    }));

    dispatch({ type: SET_FETCHING_TOTAL_BALANCES, payload: false });

    const accountsTotalBalances = getState().totalBalances.data;
    dispatch(saveDbAction('totalBalances', { data: accountsTotalBalances }, true));

    const assetsBalancesPerAccount = getState().assetsBalances.data;
    dispatch(saveDbAction('assetsBalances', { data: assetsBalancesPerAccount }, true));
  };
};

export const fetchAssetsBalancesAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      assetsBalances: { isFetching },
      session: { data: { isOnline } },
    } = getState();

    const activeAccount = getActiveAccount(accounts);
    if (!activeAccount || isFetching || !isOnline) return;

    dispatch({ type: SET_FETCHING_ASSETS_BALANCES, payload: true });

    await dispatch(fetchSupportedAssetsAction());

    await dispatch(fetchAccountWalletBalancesAction(activeAccount));
    await dispatch(fetchAssetsRatesAction());

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

export const fetchAllAccountsAssetsBalancesAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      assetsBalances: { isFetching },
      accounts: { data: accounts },
      session: { data: { isOnline } },
    } = getState();

    const activeAccount = getActiveAccount(accounts);
    if (!activeAccount || isFetching || !isOnline) return;

    dispatch({ type: SET_FETCHING_ASSETS_BALANCES, payload: true });

    await dispatch(fetchSupportedAssetsAction());

    const promises = accounts
      .filter(isNotKeyBasedType)
      .map((account) => dispatch(fetchAccountWalletBalancesAction(account)));

    await Promise
      .all(promises)
      .catch((error) => reportErrorLog('fetchAllAccountsAssetsBalancesAction failed', { error }));

    // migration for key based blances to remove existing
    const keyBasedAccount = accounts.find(({ type }) => type === ACCOUNT_TYPES.KEY_BASED);
    if (keyBasedAccount) {
      dispatch(resetAccountAssetsBalancesAction(getAccountId(keyBasedAccount)));
    }

    dispatch(fetchAssetsRatesAction());

    if (isArchanovaAccount(activeAccount)) {
      dispatch(fetchVirtualAccountBalanceAction());
    }

    dispatch({ type: SET_FETCHING_ASSETS_BALANCES, payload: false });
  };
};

export const fetchSupportedAssetsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { session: { data: { isOnline } } } = getState();

    // nothing to do if offline
    if (!isOnline) return;

    await Promise.all(Object.keys(CHAIN).map(async (chainKey) => {
      const chain = CHAIN[chainKey];
      const chainSupportedAssets = await etherspotService.getSupportedAssets(chain);
      // nothing to do if returned empty
      if (isEmpty(chainSupportedAssets)) return;

      dispatch({
        type: SET_CHAIN_SUPPORTED_ASSETS,
        payload: { chain, assets: chainSupportedAssets },
      });
    }));

    const updatedSupportedAssets = supportedAssetsPerChainSelector(getState());
    dispatch(saveDbAction('supportedAssets', { supportedAssets: updatedSupportedAssets }, true));
  };
};
