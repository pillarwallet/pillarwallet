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
import { BigNumber } from 'bignumber.js';

// constants
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import {
  UPDATE_ASSETS,
  START_ASSETS_SEARCH,
  UPDATE_ASSETS_SEARCH_RESULT,
  RESET_ASSETS_SEARCH_RESULT,
  ETH,
  UPDATE_SUPPORTED_ASSETS,
  COLLECTIBLES,
  PLR,
  BTC,
  USD,
  ASSET_CATEGORY,
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
  SET_ACCOUNT_TOTAL_BALANCE,
  SET_FETCHING_TOTAL_BALANCES,
  RESET_ACCOUNT_TOTAL_BALANCES,
} from 'constants/totalsBalancesConstants';
import { CHAIN } from 'constants/chainConstants';

// components
import Toast from 'components/Toast';

// services
import etherspotService from 'services/etherspot';
import archanovaService from 'services/archanova';
import {
  getZapperAvailableChainProtocols,
  getZapperProtocolBalanceOnNetwork,
  getZapperFiatRates,
  mapZapperProtocolIdToBalanceCategory,
} from 'services/zapper';

// utils
import { transformBalancesToObject } from 'utils/assets';
import { getSupportedChains } from 'utils/chains';
import { parseTokenAmount, reportErrorLog } from 'utils/common';
import { buildHistoryTransaction, parseFeeWithGasToken } from 'utils/history';
import {
  getActiveAccount,
  getActiveAccountId,
  getAccountAddress,
  getAccountId,
  isNotKeyBasedType,
  isArchanovaAccount,
  isEtherspotAccount,
  getAccountType,
  findAccountByAddress,
  isArchanovaAccountAddress,
} from 'utils/accounts';
import { catchTransactionError } from 'utils/wallet';
import { sumBy } from 'utils/bigNumber';

// selectors
import { accountAssetsSelector } from 'selectors/assets';
import {
  accountsSelector,
  supportedAssetsSelector,
  assetsBalancesSelector,
  fiatCurrencySelector,
} from 'selectors';

// types
import type { Asset, AssetsByAccount } from 'models/Asset';
import type { Account } from 'models/Account';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { TransactionPayload, TransactionResult, TransactionStatus } from 'models/Transaction';
import type { WalletAssetsBalances } from 'models/Balances';
import type { Chain } from 'models/Chain';

// actions
import { logEventAction } from './analyticsActions';
import { saveDbAction } from './dbActions';
import { fetchCollectiblesAction } from './collectiblesActions';
import { fetchVirtualAccountBalanceAction } from './smartWalletActions';
import { showAssetAction } from './userSettingsActions';
import { fetchAccountAssetsRatesAction, fetchAllAccountsAssetsRatesAction } from './ratesActions';
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
    const supportedAssets = supportedAssetsSelector(getState());

    await Promise.all(chains.map(async (chain) => {
      let newBalances = [];
      try {
        newBalances = await etherspotService.getBalances(chain, walletAddress, supportedAssets);
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

    smartWalletAccounts.forEach((account) => dispatch(fetchCollectiblesAction(account)));

    const accountsAddresses = smartWalletAccounts.map((account) => getAccountAddress(account));
    const availableChainProtocols = await getZapperAvailableChainProtocols(accountsAddresses);
    if (!availableChainProtocols) {
      dispatch({ type: SET_FETCHING_TOTAL_BALANCES, payload: false });
      reportErrorLog('fetchAllAccountsTotalBalancesAction failed: no availableChainProtocols', { accountsAddresses });
      return;
    }

    const currency = fiatCurrencySelector(getState());

    const zapperUsdBasedRates = await getZapperFiatRates();
    if (!zapperUsdBasedRates) {
      dispatch({ type: SET_FETCHING_TOTAL_BALANCES, payload: false });
      reportErrorLog('fetchAllAccountsTotalBalancesAction failed: no zapperUSDBasedRates', { accountsAddresses });
      return;
    }

    const usdRate = zapperUsdBasedRates[currency.toUpperCase()];
    if (currency !== USD && !usdRate) {
      dispatch({ type: SET_FETCHING_TOTAL_BALANCES, payload: false });
      reportErrorLog('fetchAllAccountsTotalBalancesAction failed: no USD rate for app currency', {
        accountsAddresses,
        zapperUsdBasedRates,
        currency,
      });
      return;
    }

    try {
      await Promise.all(availableChainProtocols.map(async ({ chain, zapperProtocolIds, zapperNetworkId }) => {
        // we don't need to pull multi chain balances for Archanova account, only Ethereum
        const requestForAddresses = chain !== CHAIN.ETHEREUM
          ? accountsAddresses.filter((address) => !isArchanovaAccountAddress(address, accounts))
          : accountsAddresses;

        const chainProtocolsBalances = await Promise.all(zapperProtocolIds.map(async (zapperProtocolId) => {
          const protocolBalancesByAccounts = await getZapperProtocolBalanceOnNetwork(
            requestForAddresses,
            zapperProtocolId,
            zapperNetworkId,
          );

          const balanceCategory = mapZapperProtocolIdToBalanceCategory(zapperProtocolId);
          if (!protocolBalancesByAccounts || !balanceCategory) return null;

          return { category: balanceCategory, balances: protocolBalancesByAccounts };
        }));

        // filter ones that are null (no protocol>category map found or no balances)
        const availableChainProtocolsBalances = chainProtocolsBalances.filter(Boolean);

        availableChainProtocolsBalances.forEach(({
          balances: protocolBalancesByAccounts,
          category: balanceCategory,
        }) => {
          Object.keys(protocolBalancesByAccounts).forEach((accountAddress) => {
            const account = findAccountByAddress(accountAddress, accounts);
            const accountProtocolBalances = protocolBalancesByAccounts[accountAddress]?.products;

            // no need to add anything no matching account found or empty balances
            if (!account || isEmpty(accountProtocolBalances)) return;

            let categoryTotalBalance = BigNumber(0);

            const categoryAssetsBalances = accountProtocolBalances.reduce((combinedBalances, balances) => {
              const protocolAssetsBalances = balances?.assets;

              // useless to proceed if no assets for provided protocol
              if (isEmpty(protocolAssetsBalances)) return combinedBalances;

              const assetsBalances = protocolAssetsBalances.map((asset) => {
                const {
                  protocol,
                  symbol,
                  label,
                  balanceUSD,
                  img,
                  share: tokensShare,
                  supply: tokensSupply,
                } = asset;

                const balanceUsdBN = BigNumber(balanceUSD);
                const value = currency === USD
                  ? balanceUsdBN
                  : balanceUsdBN.times(usdRate ?? 0);

                // TODO: do we need to fix exponential for very small values or hide small share at all?
                const share = tokensShare && tokensSupply
                  ? BigNumber(tokensShare).dividedBy(tokensSupply).times(100)
                  : null;

                return {
                  key: `${protocol}-${symbol}`,
                  service: balances.label,
                  title: label,
                  iconUrl: img ? `https://zapper.fi/images/${img}` : null,
                  share,
                  value,
                };
              });

              // add to total balance
              const totalValue = sumBy(assetsBalances, (balance) => balance.value);
              categoryTotalBalance = categoryTotalBalance.plus(totalValue);

              return [...combinedBalances, ...assetsBalances];
            }, []);

            dispatch({
              type: SET_ACCOUNT_TOTAL_BALANCE,
              payload: {
                accountId: getAccountId(account),
                chain,
                category: balanceCategory,
                balance: categoryTotalBalance,
              },
            });

            dispatch({
              type: SET_ACCOUNT_ASSETS_BALANCES,
              payload: {
                accountId: getAccountId(account),
                chain,
                category: balanceCategory,
                balances: categoryAssetsBalances,
              },
            });
          });
        });
      }));
    } catch (error) {
      reportErrorLog('fetchAllAccountsTotalBalancesAction failed', { error });
    }

    dispatch({ type: SET_FETCHING_TOTAL_BALANCES, payload: false });

    const accountsTotalBalances = getState().totalBalances.data;
    dispatch(saveDbAction('totalBalances', { data: accountsTotalBalances }, true));

    const accountsAssetsBalances = assetsBalancesSelector(getState());
    dispatch(saveDbAction('assetsBalances', { data: accountsAssetsBalances }, true));
  };
};

export const fetchAssetsBalancesAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();

    const activeAccount = getActiveAccount(accounts);
    if (!activeAccount) return;

    dispatch({ type: SET_FETCHING_ASSETS_BALANCES, payload: true });

    await dispatch(fetchAccountWalletBalancesAction(activeAccount));
    dispatch(fetchAccountAssetsRatesAction());

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

    const updatedBalances = assetsBalancesSelector(getState());
    dispatch(saveDbAction('assetsBalances', { data: updatedBalances }, true));

    const updatedTotalBalances = getState().totalBalances.data;
    dispatch(saveDbAction('totalBalances', { data: updatedTotalBalances }, true));
  };
};

export const fetchAllAccountsAssetsBalancesAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();

    const activeAccount = getActiveAccount(accounts);
    if (!activeAccount) return;

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

    dispatch(fetchAllAccountsAssetsRatesAction());

    if (isArchanovaAccount(activeAccount)) {
      dispatch(fetchVirtualAccountBalanceAction());
    }
  };
};

export const addMultipleAssetsAction = (assetsToAdd: Asset[]) => {
  return async (dispatch: Dispatch, getState: () => Object) => {
    const {
      assets: { data: assets },
      accounts: { data: accounts },
    } = getState();

    const accountId = getActiveAccountId(accounts);
    if (!accountId) return;

    const accountAssets = accountAssetsSelector(getState());
    const updatedAssets = {
      ...assets,
      [accountId]: {
        ...accountAssets,
        ...assetsToAdd.reduce((newAssets, asset) => ({ ...newAssets, [asset.symbol]: { ...asset } }), {}),
      },
    };

    assetsToAdd.forEach(asset => {
      dispatch(showAssetAction(asset));
    });
    dispatch(saveDbAction('assets', { assets: updatedAssets }, true));

    dispatch({ type: UPDATE_ASSETS, payload: updatedAssets });

    dispatch(fetchAssetsBalancesAction());

    assetsToAdd.forEach(asset => {
      dispatch(logEventAction('asset_token_added', { symbol: asset.symbol }));
    });
  };
};

export const addAssetAction = (asset: Asset) => {
  return async (dispatch: Dispatch, getState: () => Object) => {
    const {
      assets: { data: assets },
      accounts: { data: accounts },
    } = getState();

    const accountId = getActiveAccountId(accounts);
    if (!accountId) return;

    const accountAssets = accountAssetsSelector(getState());
    const updatedAssets = {
      ...assets,
      [accountId]: { ...accountAssets, [asset.symbol]: { ...asset } },
    };

    dispatch(showAssetAction(asset));
    dispatch(saveDbAction('assets', { assets: updatedAssets }, true));

    dispatch({ type: UPDATE_ASSETS, payload: updatedAssets });

    Toast.show({
      message: t('toast.assetAdded', { assetName: asset.name, assetSymbol: asset.symbol }),
      emoji: 'ok_hand',
      autoClose: true,
    });

    dispatch(fetchAssetsBalancesAction());

    dispatch(logEventAction('asset_token_added', { symbol: asset.symbol }));
  };
};

export const updateAssetsSearchResultAction = (assets: Asset[]) => ({
  type: UPDATE_ASSETS_SEARCH_RESULT,
  payload: assets,
});

export const searchAssetsAction = (query: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { assets: { supportedAssets } } = getState();
    const search = query.toUpperCase();

    let matchingAssets = supportedAssets.filter(({
      name,
      symbol,
    }) => name.toUpperCase().includes(search) || symbol.toUpperCase().includes(search));

    if (matchingAssets?.length > 0) {
      dispatch(updateAssetsSearchResultAction(matchingAssets));
      return;
    }

    dispatch({ type: START_ASSETS_SEARCH });

    const latestSupportedAssets = await etherspotService.getSupportedAssets();
    if (!latestSupportedAssets) {
      reportErrorLog('searchAssetsAction failed: no latestSupportedAssets', { query });
      dispatch(updateAssetsSearchResultAction([]));
      return;
    }

    matchingAssets = latestSupportedAssets.filter(({
      name,
      symbol,
    }) => name.toUpperCase().includes(search) || symbol.toUpperCase().includes(search));

    dispatch(updateAssetsSearchResultAction(matchingAssets));
  };
};

export const resetSearchAssetsResultAction = () => ({
  type: RESET_ASSETS_SEARCH_RESULT,
});

export const getSupportedTokens = (supportedAssets: Asset[], accountsAssets: AssetsByAccount, account: Account) => {
  const accountId = getAccountId(account);
  const accountAssets = accountsAssets[accountId] ?? {};
  const accountAssetsTickers = Object.keys(accountAssets);

  // HACK: Dirty fix for users who removed somehow ETH and PLR from their assets list
  if (!accountAssetsTickers.includes(ETH)) accountAssetsTickers.push(ETH);
  if (!accountAssetsTickers.includes(PLR)) accountAssetsTickers.push(PLR);
  // remove BTC if it is already shown in SW/KW
  const updatedAccountAssets = supportedAssets
    .filter(({ symbol }) => accountAssetsTickers.includes(symbol) && symbol !== BTC)
    .reduce((memo, asset) => ({ ...memo, [asset.symbol]: asset }), {});
  // $FlowFixMe: flow update to 0.122
  return { id: accountId, ...updatedAccountAssets };
};

export const loadSupportedAssetsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { session: { data: { isOnline } } } = getState();

    // nothing to do if offline
    if (!isOnline) return;

    const supportedAssets = await etherspotService.getSupportedAssets();

    // nothing to do if returned empty
    if (isEmpty(supportedAssets)) return;

    dispatch({
      type: UPDATE_SUPPORTED_ASSETS,
      payload: supportedAssets,
    });
    dispatch(saveDbAction('supportedAssets', { supportedAssets }, true));
  };
};

// TODO: handle side chain balances
export const checkForMissedAssetsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
      assets: { data: accountsAssets },
    } = getState();

    await dispatch(loadSupportedAssetsAction());
    const supportedAssets = supportedAssetsSelector(getState());

    const accountUpdatedAssets = accounts
      .filter(isNotKeyBasedType)
      .map((acc) => getSupportedTokens(supportedAssets, accountsAssets, acc))
      .reduce((memo, { id, ...rest }) => ({ ...memo, [id]: rest }), {});

    // check tx history if some assets are not enabled
    const ownedAssetsByAccounts = await Promise.all(
      accounts
        .filter(isNotKeyBasedType)
        .map(async (account) => {
          const accountAddress = getAccountAddress(account);
          const accountId = getAccountId(account);
          // TODO: refactor whole checkForMissedAssetsAction
          // $FlowFixMe: didn't refactor existing code, flow is messing up due obvious reasons
          const ownedAssets = await etherspotService.getOwnedAssets(CHAIN.ETHEREUM, accountAddress, supportedAssets);
          return { id: accountId, ...ownedAssets };
        }),
    );

    const allAccountAssets = ownedAssetsByAccounts
      .reduce((memo, { id, ...rest }) => ({ ...memo, [id]: rest }), {});

    const updatedAssets = Object.keys(accountUpdatedAssets)
      .map((acc) => ({ id: acc, ...accountUpdatedAssets[acc], ...allAccountAssets[acc] }))
      .reduce((memo, { id, ...rest }) => ({ ...memo, [id]: rest }), {});

    let newAssetsFound = false;
    Object.keys(updatedAssets).forEach(account => {
      if (!accountsAssets[account] || !updatedAssets[account]) {
        newAssetsFound = true;
        return;
      }

      const assetsInAccountBefore = Object.keys(accountsAssets[account]).length;
      const assetsInAccountAfter = Object.keys(updatedAssets[account]).length;

      if (assetsInAccountBefore !== assetsInAccountAfter) {
        newAssetsFound = true;
      }
    });

    if (newAssetsFound) {
      dispatch({
        type: UPDATE_ASSETS,
        payload: updatedAssets,
      });
      dispatch(fetchAssetsBalancesAction());
      dispatch(saveDbAction('assets', { assets: updatedAssets }, true));
    }
  };
};
