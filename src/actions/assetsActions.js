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

// components
import Toast from 'components/Toast';

// utils
import { getAssetsAsList, transformBalancesToObject } from 'utils/assets';
import { parseTokenAmount, reportErrorLog, uniqBy } from 'utils/common';
import { buildHistoryTransaction, parseFeeWithGasToken, updateAccountHistory } from 'utils/history';
import {
  getActiveAccount,
  getActiveAccountId,
  getAccountAddress,
  getAccountId,
  isEthersportSmartWalletType,
} from 'utils/accounts';
import { catchTransactionError } from 'utils/wallet';

// services
import etherspot from 'services/etherspot';

// selectors
import { balancesSelector } from 'selectors';
import { accountAssetsSelector, makeAccountEnabledAssetsSelector } from 'selectors/assets';

// types
import type { TransactionPayload } from 'models/Transaction';
import type { Asset, AssetsByAccount, Balances } from 'models/Asset';
import type { Account } from 'models/Account';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type SDKWrapper from 'services/api';

// actions
import { saveDbAction } from './dbActions';
import { fetchCollectiblesAction } from './collectiblesActions';
import { addExchangeAllowanceAction } from './exchangeActions';
import { showAssetAction } from './userSettingsActions';
import { fetchAccountAssetsRatesAction, fetchAllAccountsAssetsRatesAction } from './ratesActions';
import { addEnsRegistryRecordAction } from './ensRegistryActions';
import { logEventAction } from './analyticsActions';
import { fetchAccountDepositBalanceAction } from './etherspotActions';


type TransactionStatus = {
  isSuccess: boolean,
  error: ?string,
  noRetry?: boolean,
  to: string,
  note: ?string,
};

type TransactionResult = {
  error?: string,
  hash?: string,
  noRetry?: boolean,
};

export const sendAssetAction = (
  transaction: TransactionPayload,
  callback: (result: TransactionStatus) => void,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      tokenType,
      symbol,
      usePPN,
      receiverEnsName,
      note,
      gasToken,
      txFeeInWei,
      extra: transactionExtra,
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
          to,
          note,
          noRetry: true,
        });
        return;
      }
    }

    // build fee with gas token if present
    const feeWithGasToken = !isEmpty(gasToken)
      ? parseFeeWithGasToken(gasToken, txFeeInWei)
      : null;

    const transactionResult: TransactionResult = await etherspot
      .sendTransaction(transaction, accountAddress, usePPN)
      .then(({ hash }) => ({ hash }))
      .catch((error) => catchTransactionError(error, logTransactionType, transaction));

    const transactionHash = transactionResult?.hash;
    if (!transactionHash) {
      callback({
        isSuccess: false,
        error: transactionResult?.error || t('error.transactionFailed.default'),
        to,
        note,
      });
      return;
    }

    let historyTx;

    const transactionValue = !isCollectibleTransaction && transaction.amount
      ? parseTokenAmount(transaction.amount, transaction.decimals)
      : 0;

    if (transactionHash) {
      historyTx = buildHistoryTransaction({
        ...transactionResult,
        to,
        from: accountAddress,
        asset: isCollectibleTransaction ? transaction.name : symbol,
        note,
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
          tag: transaction.tag,
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
    }

    if (usePPN && transactionHash) {
      dispatch(fetchAccountDepositBalanceAction()); // refresh
    } else if (!usePPN) {
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

    const allowancePayload = transactionExtra?.allowance;
    if (allowancePayload && !isEmpty(allowancePayload)) {
      const { provider, fromAssetCode, toAssetCode } = allowancePayload;
      dispatch(addExchangeAllowanceAction(provider, fromAssetCode, toAssetCode, transactionHash));
    }

    callback({
      isSuccess: true,
      error: null,
      txHash: transactionHash,
      note,
      to,
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

    const newBalances = isEthersportSmartWalletType(account)
      ? await etherspot.getBalances(walletAddress, getAssetsAsList(accountAssets))
      : await api.fetchBalances({
        address: walletAddress,
        assets: getAssetsAsList(accountAssets),
      });

    if (!isEmpty(newBalances)) {
      await dispatch(updateAccountBalancesAction(accountId, transformBalancesToObject(newBalances)));
    }
  };
};

export const fetchAssetsBalancesAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { accounts: { data: accounts } } = getState();

    const activeAccount = getActiveAccount(accounts);
    if (!activeAccount) return;

    await dispatch(fetchAccountAssetsBalancesAction(activeAccount));

    dispatch(fetchAccountAssetsRatesAction());
    dispatch(fetchAccountDepositBalanceAction());
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
      .filter(isEthersportSmartWalletType)
      .map((account) => dispatch(fetchAccountAssetsBalancesAction(account)));

    await Promise
      .all(promises)
      .catch((error) => reportErrorLog('fetchAllAccountsBalancesAction failed', { error }));

    // migration to etherspot, reset other balances
    accounts
      .filter((account) => !isEthersportSmartWalletType(account))
      .forEach((account) => dispatch(resetAccountBalancesAction(getAccountId(account))));

    dispatch(fetchAllAccountsAssetsRatesAction());
    dispatch(fetchAccountDepositBalanceAction());
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
      .filter(isEthersportSmartWalletType)
      .map((acc) => getSupportedTokens(walletSupportedAssets, accountsAssets, acc))
      .reduce((memo, { id, ...rest }) => ({ ...memo, [id]: rest }), {});

    // check tx history if some assets are not enabled
    const ownedAssetsByAccount = await Promise.all(
      accounts
        .filter(isEthersportSmartWalletType)
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
