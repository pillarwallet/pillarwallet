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
import { UPDATE_TX_COUNT } from 'constants/txCountConstants';
import { ADD_TRANSACTION, TX_CONFIRMED_STATUS, TX_PENDING_STATUS } from 'constants/historyConstants';
import { ADD_COLLECTIBLE_TRANSACTION, COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import { PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS } from 'constants/paymentNetworkConstants';
import { ERROR_TYPE } from 'constants/transactionsConstants';

import Toast from 'components/Toast';

import CryptoWallet from 'services/cryptoWallet';

import type {
  TokenTransactionPayload,
  CollectibleTransactionPayload,
  TransactionPayload,
  SyntheticTransaction,
} from 'models/Transaction';
import type { Asset, AssetsByAccount, Balances } from 'models/Asset';
import type { Account } from 'models/Account';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import { getAssetsAsList, transformBalancesToObject } from 'utils/assets';
import {
  delay,
  noop,
  parseTokenAmount,
  reportLog,
  uniqBy,
} from 'utils/common';
import { buildHistoryTransaction, parseFeeWithGasToken, updateAccountHistory } from 'utils/history';
import {
  getActiveAccountAddress,
  getActiveAccount,
  getActiveAccountId,
  getActiveAccountType,
  getAccountAddress,
  getAccountId,
  checkIfSmartWalletAccount,
  isNotKeyBasedType,
} from 'utils/accounts';
import { accountAssetsSelector, makeAccountEnabledAssetsSelector } from 'selectors/assets';
import { balancesSelector } from 'selectors';
import { logEventAction } from 'actions/analyticsActions';
import { commitSyntheticsTransaction } from 'actions/syntheticsActions';
import type SDKWrapper from 'services/api';
import { saveDbAction } from './dbActions';
import { fetchCollectiblesAction } from './collectiblesActions';
import { ensureSmartAccountConnectedAction, fetchVirtualAccountBalanceAction } from './smartWalletActions';
import { addExchangeAllowanceAction } from './exchangeActions';
import { showAssetAction } from './userSettingsActions';
import { fetchAccountAssetsRatesAction, fetchAllAccountsAssetsRatesAction } from './ratesActions';
import { addEnsRegistryRecordAction } from './ensRegistryActions';

type TransactionStatus = {
  isSuccess: boolean,
  error: ?string,
};

export const sendAssetAction = (
  transaction: TransactionPayload,
  wallet: Object,
  callback: Function = noop,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const tokenType = get(transaction, 'tokenType', '');
    const symbol = get(transaction, 'symbol', '');
    const allowancePayload = get(transaction, 'extra.allowance', {});
    const usePPN = get(transaction, 'usePPN', false);
    const receiverEnsName = get(transaction, 'receiverEnsName');

    if (tokenType === COLLECTIBLES) {
      await dispatch(fetchCollectiblesAction());
    }

    const {
      accounts: { data: accounts },
      collectibles: { data: collectibles, transactionHistory: collectiblesHistory },
    } = getState();

    const accountId = getActiveAccountId(accounts);
    const activeAccount = getActiveAccount(accounts);
    const accountAddress = getActiveAccountAddress(accounts);
    const activeAccountType = getActiveAccountType(accounts);
    if (!activeAccount) return;

    if (activeAccountType === ACCOUNT_TYPES.SMART_WALLET) {
      await dispatch(ensureSmartAccountConnectedAction(wallet.privateKey));
    }

    let tokenTx = {};
    let historyTx;
    const accountCollectibles = collectibles[accountId] || [];
    const accountCollectiblesHistory = collectiblesHistory[accountId] || [];
    const to = toChecksumAddress(transaction.to);
    const { note, gasToken, txFeeInWei } = transaction;

    // get wallet provider
    const cryptoWallet = new CryptoWallet(wallet.privateKey, activeAccount);
    const walletProvider = await cryptoWallet.getProvider();

    // build fee with gas token if present
    const feeWithGasToken = !isEmpty(gasToken)
      ? parseFeeWithGasToken(gasToken, txFeeInWei)
      : null;

    // send collectible
    if (tokenType === COLLECTIBLES) {
      // $FlowFixMe
      const { tokenId } = (transaction: CollectibleTransactionPayload);
      const collectibleInfo = accountCollectibles.find(item => item.id === tokenId);
      if (!collectibleInfo) {
        tokenTx = {
          error: ERROR_TYPE.NOT_OWNED,
          hash: null,
          noRetry: true,
        };
      } else {
        // $FlowFixMe
        tokenTx = await walletProvider.transferERC721(
          activeAccount,
          // $FlowFixMe
          transaction,
          getState(),
        );

        // $FlowFixMe
        if (tokenTx.hash) {
          historyTx = {
            ...buildHistoryTransaction({
              ...tokenTx,
              asset: transaction.name,
              note,
              feeWithGasToken,
            }),
            to,
            from: accountAddress,
            assetData: { ...collectibleInfo },
            type: COLLECTIBLE_TRANSACTION,
            icon: collectibleInfo.icon,
          };
        }
      }
    // send Ether
    } else if (symbol === ETH) {
      // $FlowFixMe
      tokenTx = await walletProvider.transferETH(
        activeAccount,
        // $FlowFixMe
        transaction,
        getState(),
      );

      // $FlowFixMe
      if (tokenTx.hash) {
        historyTx = buildHistoryTransaction({
          ...tokenTx,
          asset: symbol,
          note,
          gasPrice: transaction.gasPrice,
          gasLimit: transaction.gasLimit,
          isPPNTransaction: usePPN,
          status: usePPN ? TX_CONFIRMED_STATUS : TX_PENDING_STATUS,
          extra: transaction.extra || null,
          tag: transaction.tag || null,
          feeWithGasToken,
        });
      }
    // send ERC20 token
    } else {
      const {
        amount,
        decimals,
        // $FlowFixMe
      } = (transaction: TokenTransactionPayload);

      tokenTx = await walletProvider.transferERC20(
        activeAccount,
        // $FlowFixMe
        transaction,
        getState(),
      );

      // $FlowFixMe
      if (tokenTx.hash) {
        historyTx = buildHistoryTransaction({
          ...tokenTx,
          asset: symbol,
          value: parseTokenAmount(amount, decimals),
          to, // HACK: in the real ERC20Trx object the 'To' field contains smart contract address
          note,
          gasPrice: transaction.gasPrice,
          gasLimit: transaction.gasLimit,
          isPPNTransaction: usePPN,
          status: usePPN ? TX_CONFIRMED_STATUS : TX_PENDING_STATUS,
          extra: transaction.extra || null,
          tag: transaction.tag || null,
          feeWithGasToken,
        });
      }
    }

    if (checkIfSmartWalletAccount(activeAccount) && !usePPN && tokenTx.hash) {
      dispatch({
        type: PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS,
        payload: tokenTx.hash,
      });
    }

    // update transaction history
    if (historyTx) {
      if (transaction.tokenType && transaction.tokenType === COLLECTIBLES) {
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
        // check if there's a need to commit synthetic asset transaction
        const syntheticTransactionExtra: SyntheticTransaction = get(historyTx, 'extra.syntheticTransaction');
        if (!isEmpty(syntheticTransactionExtra)) {
          const { transactionId, toAddress } = syntheticTransactionExtra;
          if (transactionId) {
            dispatch(commitSyntheticsTransaction(transactionId, historyTx.hash));
            // change history receiver address to actual receiver address rather than synthetics service address
            historyTx = { ...historyTx, to: toAddress };
          } else {
            reportLog('Failed to get transactionId during synthetics exchange.', { hash: historyTx.hash });
          }
        }

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
    }

    // update transaction count
    if (tokenTx.hash && tokenTx.transactionCount) {
      const txCountNew = { lastCount: tokenTx.transactionCount, lastNonce: tokenTx.nonce };
      dispatch({
        type: UPDATE_TX_COUNT,
        payload: txCountNew,
      });
      dispatch(saveDbAction('txCount', { txCount: txCountNew }, true));
    }

    const txStatus: TransactionStatus = tokenTx.hash
      ? {
        isSuccess: true, error: null, note, to, txHash: tokenTx.hash,
      }
      : {
        isSuccess: false, error: tokenTx.error, note, to, noRetry: tokenTx.noRetry,
      };

    if (Object.keys(allowancePayload).length && tokenTx.hash) {
      const { provider, fromAssetCode, toAssetCode } = allowancePayload;
      dispatch(addExchangeAllowanceAction(provider, fromAssetCode, toAssetCode, tokenTx.hash));
    }

    callback(txStatus);
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

    const newBalances = await api.fetchBalances({
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

    if (checkIfSmartWalletAccount(activeAccount)) {
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
      .catch((error) => reportLog('fetchAllAccountsBalancesAction failed', { error }));

    // migration for key based balances to remove existing
    const keyBasedAccount = accounts.find(({ type }) => type === ACCOUNT_TYPES.KEY_BASED);
    if (keyBasedAccount) {
      dispatch(resetAccountBalancesAction(getAccountId(keyBasedAccount)));
    }

    dispatch(fetchAllAccountsAssetsRatesAction());

    if (checkIfSmartWalletAccount(activeAccount)) {
      dispatch(fetchVirtualAccountBalanceAction());
    }
  };
};

export const fetchInitialAssetsAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    dispatch({
      type: UPDATE_ASSETS_STATE,
      payload: FETCHING_INITIAL,
    });
    await delay(1000);

    const {
      user: { data: { walletId } },
      accounts: { data: accounts },
    } = getState();

    const initialAssets = await api.fetchInitialAssets(walletId);
    if (isEmpty(initialAssets)) {
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

export const startAssetsSearchAction = () => ({
  type: START_ASSETS_SEARCH,
});

export const searchAssetsAction = (query: string) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const { assets: { supportedAssets } } = getState();
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

    const { user: { data: { walletId } } } = getState();

    dispatch(startAssetsSearchAction());

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
      user: { data: { walletId } },
      session: { data: { isOnline } },
    } = getState();

    // nothing to do if offline
    if (!isOnline) return;

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
