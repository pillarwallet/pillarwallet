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
import isEmpty from 'lodash.isempty';
import { toChecksumAddress } from '@netgum/utils';
import t from 'translations/translate';

// constants
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import {
  UPDATE_ASSETS_STATE,
  UPDATE_ASSETS,
  START_ASSETS_SEARCH,
  UPDATE_ASSETS_SEARCH_RESULT,
  RESET_ASSETS_SEARCH_RESULT,
  SET_INITIAL_ASSETS,
  FETCHING,
  FETCHING_INITIAL,
  FETCH_INITIAL_FAILED,
  ETH,
  UPDATE_BALANCES,
  UPDATE_SUPPORTED_ASSETS,
  COLLECTIBLES,
  PLR,
  BTC,
} from 'constants/assetsConstants';
import { ADD_TRANSACTION, TX_CONFIRMED_STATUS, TX_PENDING_STATUS } from 'constants/historyConstants';
import { ADD_COLLECTIBLE_TRANSACTION, COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import { PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS } from 'constants/paymentNetworkConstants';
import { ERROR_TYPE } from 'constants/transactionsConstants';
import { SET_TOTAL_ACCOUNT_CHAIN_CATEGORY_BALANCE, SET_FETCHING_TOTALS } from 'constants/totalsConstants';
import { NetworkNames } from 'etherspot';

// components
import Toast from 'components/Toast';

// services
import etherspotService from 'services/etherspot';
import archanovaService from 'services/archanova';
import {
  getZapperAvailableChainProtocols,
  getZapperProtocolBalanceOnNetwork,
  mapZapperProtocolIdToBalanceCategory,
} from 'services/zapper';

// utils
import { getAssetsAsList, transformBalancesToObject } from 'utils/assets';
import {
  parseTokenAmount,
  reportErrorLog,
  uniqBy,
  wrapBigNumber,
} from 'utils/common';
import { buildHistoryTransaction, parseFeeWithGasToken, updateAccountHistory } from 'utils/history';
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
} from 'utils/accounts';
import { catchTransactionError } from 'utils/wallet';
import { sum } from 'utils/bigNumber';

// selectors
import { accountAssetsSelector, makeAccountEnabledAssetsSelector } from 'selectors/assets';
import { accountsSelector, balancesSelector } from 'selectors';
import { accountsTotalBalancesSelector } from 'selectors/balances';

// types
import type { Asset, AssetsByAccount, Balances } from 'models/Asset';
import type { Account } from 'models/Account';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type SDKWrapper from 'services/api';
import type { TransactionPayload, TransactionResult, TransactionStatus } from 'models/Transaction';

// actions
import { logEventAction } from './analyticsActions';
import { saveDbAction } from './dbActions';
import { fetchCollectiblesAction } from './collectiblesActions';
import { fetchVirtualAccountBalanceAction } from './smartWalletActions';
import { addExchangeAllowanceIfNeededAction } from './exchangeActions';
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
      collectibles: { data: collectibles, transactionHistory: collectiblesHistory },
    } = getState();

    const activeAccount = getActiveAccount(accounts);

    if (!activeAccount) {
      reportErrorLog('sendAssetAction failed: no active account');
      return;
    }

    const accountId = getAccountId(activeAccount);
    const accountAddress = getAccountAddress(activeAccount);

    const accountCollectibles = collectibles[accountId] || [];
    const accountCollectiblesHistory = collectiblesHistory[accountId] || [];

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

    let activeWalletService;
    switch (getAccountType(activeAccount)) {
      case ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET:
        activeWalletService = archanovaService;
        break;
      case ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET:
        activeWalletService = etherspotService;
        break;
      default:
        break;
    }

    if (!activeWalletService) {
      callback({
        isSuccess: false,
        error: t('error.transactionFailed.default'),
      });
      return;
    }

    let transactionResult: ?TransactionResult;
    let transactionErrorMessage: ?string;

    try {
      transactionResult = await activeWalletService.sendTransaction(transaction, accountAddress, usePPN);
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
     * This (waitForTransactionHashFromSubmittedBatch) covers edge case for Wallet Connect alone,
     * but might be used for other scenarios where transaction hash is needed on submit callback.
     *
     * If transaction is sent through Etherspot then transaction will be submitted asynchronously
     * along with batch which won't provide actual transaction hash instantaneously.
     *
     * Wallet Connect approve request expects actual transaction hash to be sent back to Dapp
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
        transactionHash = await etherspotService.waitForTransactionHashFromSubmittedBatch(transactionBatchHash);
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
      dispatch({
        type: ADD_COLLECTIBLE_TRANSACTION,
        payload: {
          transactionData: { ...historyTx },
          tokenId: transaction.tokenId,
          accountId,
        },
      });

      const updatedCollectiblesHistory = {
        ...collectiblesHistory,
        [accountId]: [...accountCollectiblesHistory, historyTx],
      };

      await dispatch(saveDbAction('collectiblesHistory', { collectiblesHistory: updatedCollectiblesHistory }, true));

      const updatedAccountCollectibles = accountCollectibles.filter(item => item.id !== transaction.tokenId);
      const updatedCollectibles = {
        ...collectibles,
        [accountId]: updatedAccountCollectibles,
      };

      dispatch(saveDbAction('collectibles', { collectibles: updatedCollectibles }, true));
    } else {
      dispatch({ type: ADD_TRANSACTION, payload: { accountId, historyTx } });

      const { history: { data: currentHistory } } = getState();
      const accountHistory = currentHistory[accountId] || [];
      const updatedAccountHistory = uniqBy([historyTx, ...accountHistory], 'hash');
      const updatedHistory = updateAccountHistory(currentHistory, accountId, updatedAccountHistory);
      dispatch(saveDbAction('history', { history: updatedHistory }, true));
    }

    if (receiverEnsName) {
      dispatch(addEnsRegistryRecordAction(to, receiverEnsName));
    }

    dispatch(addExchangeAllowanceIfNeededAction(historyTx));

    callback({
      isSuccess: true,
      error: null,
      hash: transactionHash,
      batchHash: transactionBatchHash,
    });
  };
};

export const updateAccountBalancesAction = (accountId: string, balances: Balances) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const allBalances = getState().balances.data;
    const currentAccountBalances = allBalances[accountId] || {};
    const updatedBalances = {
      ...allBalances,
      [accountId]: { ...currentAccountBalances, ...balances },
    };
    dispatch(saveDbAction('balances', { balances: updatedBalances }, true));
    dispatch({
      type: UPDATE_BALANCES,
      payload: updatedBalances,
    });
  };
};

export const fetchAccountAssetsBalancesAction = (account: Account) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const walletAddress = getAccountAddress(account);

    const accountId = getAccountId(account);
    if (!walletAddress || !accountId) return;

    const accountAssets = makeAccountEnabledAssetsSelector(accountId)(getState());

    dispatch({
      type: UPDATE_ASSETS_STATE,
      payload: FETCHING,
    });

    const newBalances = isEtherspotAccount(account)
      ? await etherspotService.getBalances(walletAddress, getAssetsAsList(accountAssets))
      : await api.fetchBalances({
        address: walletAddress,
        assets: getAssetsAsList(accountAssets),
      });

    if (!isEmpty(newBalances)) {
      await dispatch(updateAccountBalancesAction(accountId, transformBalancesToObject(newBalances)));
    }
  };
};

export const fetchAllAccountsTotalsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (getState().totals.isFetching) return;

    dispatch({ type: SET_FETCHING_TOTALS, payload: true });
    dispatch(fetchAllCrosschainBalances());

    const accounts = accountsSelector(getState());
    const smartWalletAccounts = accounts.filter(isNotKeyBasedType);

    smartWalletAccounts.forEach((account) => dispatch(fetchCollectiblesAction(account)));

    const accountsAddresses = smartWalletAccounts.map((account) => getAccountAddress(account));
    const availableChainProtocols = await getZapperAvailableChainProtocols(accountsAddresses);
    if (!availableChainProtocols) {
      reportErrorLog('fetchAllAccountsTotalsAction failed: no availableChainProtocols', { accountsAddresses });
      return;
    }

    try {
      await Promise.all(availableChainProtocols.map(async ({ chain, zapperProtocolIds, zapperNetworkId }) => {
        const chainProtocolsBalances = await Promise.all(zapperProtocolIds.map(async (zapperProtocolId) => {
          const protocolBalancesByAccounts = await getZapperProtocolBalanceOnNetwork(
            accountsAddresses,
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

            const accountCategoryBalance = accountProtocolBalances.reduce((categoryBalance, balances) => {
              const protocolBalances = balances?.assets;
              if (isEmpty(protocolBalances)) return categoryBalance;

              const protocolBalanceValues = protocolBalances.map(({ balanceUSD }) => wrapBigNumber(balanceUSD ?? 0));

              return sum([categoryBalance, ...protocolBalanceValues]);
            }, wrapBigNumber(0));

            dispatch({
              type: SET_TOTAL_ACCOUNT_CHAIN_CATEGORY_BALANCE,
              payload: {
                accountId: getAccountId(account),
                chain,
                category: balanceCategory,
                balance: accountCategoryBalance,
              },
            });
          });
        });
      }));
    } catch (error) {
      reportErrorLog('fetchAllAccountsTotalsAction failed', { error });
    }

    dispatch({ type: SET_FETCHING_TOTALS, payload: false });

    const accountsTotalBalances = accountsTotalBalancesSelector(getState());
    dispatch(saveDbAction('totalBalances', { balances: accountsTotalBalances }, true));
  };
};

export const fetchAssetsBalancesAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();

    const activeAccount = getActiveAccount(accounts);
    if (!activeAccount) return;

    await dispatch(fetchAccountAssetsBalancesAction(activeAccount));
    dispatch(fetchAccountAssetsRatesAction());

    if (isArchanovaAccount(activeAccount)) {
      dispatch(fetchVirtualAccountBalanceAction());
    }
  };
};

export const resetAccountBalancesAction = (accountId: string) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const allBalances = balancesSelector(getState());
    if (isEmpty(allBalances[accountId])) return; // already empty
    const updatedBalances = Object.keys(allBalances).reduce((updated, balancesAccountId) => {
      if (accountId !== balancesAccountId) {
        updated[balancesAccountId] = allBalances[balancesAccountId];
      }
      return updated;
    }, {});
    dispatch(saveDbAction('balances', { balances: updatedBalances }, true));
    dispatch({
      type: UPDATE_BALANCES,
      payload: updatedBalances,
    });
  };
};

export const fetchAllAccountsBalancesAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();

    const activeAccount = getActiveAccount(accounts);
    if (!activeAccount) return;

    const promises = accounts
      .filter(isNotKeyBasedType)
      .map((account) => dispatch(fetchAccountAssetsBalancesAction(account)));

    await Promise
      .all(promises)
      .catch((error) => reportErrorLog('fetchAllAccountsBalancesAction failed', { error }));

    // migration for key based balances to remove existing
    const keyBasedAccount = accounts.find(({ type }) => type === ACCOUNT_TYPES.KEY_BASED);
    if (keyBasedAccount) {
      dispatch(resetAccountBalancesAction(getAccountId(keyBasedAccount)));
    }

    dispatch(fetchAllAccountsAssetsRatesAction());

    if (isArchanovaAccount(activeAccount)) {
      dispatch(fetchVirtualAccountBalanceAction());
    }
  };
};

export const fetchInitialAssetsAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: user },
      accounts: { data: accounts },
    } = getState();

    const walletId = user?.walletId;
    if (!walletId) {
      reportErrorLog('fetchInitialAssetsAction failed: no walletId', { user });
      return;
    }

    dispatch({
      type: UPDATE_ASSETS_STATE,
      payload: FETCHING_INITIAL,
    });

    const initialAssets = await api.fetchInitialAssets(walletId);
    if (isEmpty(initialAssets)) {
      // TODO: add default initial assets if none set
      dispatch({
        type: UPDATE_ASSETS_STATE,
        payload: FETCH_INITIAL_FAILED,
      });
      return;
    }

    const activeAccountId = getActiveAccountId(accounts);
    dispatch({
      type: SET_INITIAL_ASSETS,
      payload: {
        accountId: activeAccountId,
        assets: initialAssets,
      },
    });

    dispatch(fetchAssetsBalancesAction());
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

export const searchAssetsAction = (query: string) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      assets: { supportedAssets },
      user: { data: user },
    } = getState();
    const search = query.toUpperCase();

    const filteredAssets = supportedAssets.filter(({ name, symbol }) => {
      return (name.toUpperCase().includes(search) || symbol.toUpperCase().includes(search)) && symbol !== BTC;
    });

    if (filteredAssets.length > 0) {
      dispatch({
        type: UPDATE_ASSETS_SEARCH_RESULT,
        payload: filteredAssets,
      });

      return;
    }

    const walletId = user?.walletId;
    if (!walletId) {
      reportErrorLog('searchAssetsAction failed: no walletId', { user });
      return;
    }

    dispatch({ type: START_ASSETS_SEARCH });

    const apiAssets = await api.assetsSearch(query, walletId);
    dispatch({
      type: UPDATE_ASSETS_SEARCH_RESULT,
      payload: apiAssets,
    });
  };
};

export const resetSearchAssetsResultAction = () => ({
  type: RESET_ASSETS_SEARCH_RESULT,
});

export const getSupportedTokens = (supportedAssets: Asset[], accountsAssets: AssetsByAccount, account: Account) => {
  const accountId = getAccountId(account);
  const accountAssets = get(accountsAssets, accountId, {});
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

export const getAllOwnedAssets = async (api: SDKWrapper, accountId: string, supportedAssets: Asset[]): Object => {
  const addressErc20Tokens = await api.getAddressErc20TokensInfo(accountId); // all address' assets except ETH;
  const accOwnedErc20Assets = {};
  if (addressErc20Tokens.length) {
    addressErc20Tokens.forEach((token) => {
      const tokenTicker = get(token, 'tokenInfo.symbol', '');
      const supportedAsset = supportedAssets.find(asset => asset.symbol === tokenTicker);
      if (supportedAsset && !accOwnedErc20Assets[tokenTicker]) {
        accOwnedErc20Assets[tokenTicker] = supportedAsset;
      }
    });
  }
  return accOwnedErc20Assets;
};

export const loadSupportedAssetsAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: user },
      session: { data: { isOnline } },
    } = getState();

    // nothing to do if offline
    if (!isOnline) return;

    const walletId = user?.walletId;
    if (!walletId) {
      reportErrorLog('loadSupportedAssetsAction failed: no walletId', { user });
      return;
    }

    const supportedAssets = await api.fetchSupportedAssets(walletId);

    // nothing to do if returned empty
    if (isEmpty(supportedAssets)) return;

    dispatch({
      type: UPDATE_SUPPORTED_ASSETS,
      payload: supportedAssets,
    });
    dispatch(saveDbAction('supportedAssets', { supportedAssets }, true));
  };
};

export const checkForMissedAssetsAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      accounts: { data: accounts },
      assets: { data: accountsAssets },
    } = getState();

    await dispatch(loadSupportedAssetsAction());
    const walletSupportedAssets = get(getState(), 'assets.supportedAssets', []);

    const accountUpdatedAssets = accounts
      .filter(isNotKeyBasedType)
      .map((acc) => getSupportedTokens(walletSupportedAssets, accountsAssets, acc))
      .reduce((memo, { id, ...rest }) => ({ ...memo, [id]: rest }), {});

    // check tx history if some assets are not enabled
    const ownedAssetsByAccount = await Promise.all(
      accounts
        .filter(isNotKeyBasedType)
        .map(async (acc) => {
          const accountId = getAccountId(acc);
          const ownedAssets = await getAllOwnedAssets(api, accountId, walletSupportedAssets);
          return { id: accountId, ...ownedAssets };
        }),
    );

    const allAccountAssets = ownedAssetsByAccount
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

export const fetchAllCrosschainBalances = () => {
  return async () => {
    // eslint-disable-next-line no-unused-vars
    const { Mainnet, Matic, Bsc, Xdai } = NetworkNames;

    const mainnetBalance = await etherspotService.instances[NetworkNames.Mainnet].getAccountBalances();
    const maticBalance = await etherspotService.instances[NetworkNames.Matic].getAccountBalances();
    const bscBalance = await etherspotService.instances[NetworkNames.Bsc].getAccountBalances();
    const xdaiBalance = await etherspotService.instances[NetworkNames.Xdai].getAccountBalances();

    const balances = {
      Mainnet: mainnetBalance,
      Matic: maticBalance,
      Bsc: bscBalance,
      Xdai: xdaiBalance,
    };

    return balances;
  };
};
