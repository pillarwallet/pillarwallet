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
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import {
  UPDATE_ASSETS_STATE,
  UPDATE_ASSETS,
  START_ASSETS_SEARCH,
  UPDATE_ASSETS_SEARCH_RESULT,
  RESET_ASSETS_SEARCH_RESULT,
  REMOVE_ASSET,
  SET_INITIAL_ASSETS,
  FETCHING,
  FETCHING_INITIAL,
  FETCH_INITIAL_FAILED,
  ETH,
  UPDATE_BALANCES,
  UPDATE_SUPPORTED_ASSETS,
  COLLECTIBLES,
} from 'constants/assetsConstants';
import { UPDATE_TX_COUNT } from 'constants/txCountConstants';
import { ADD_TRANSACTION } from 'constants/historyConstants';
import { UPDATE_RATES } from 'constants/ratesConstants';
import { ADD_COLLECTIBLE_TRANSACTION, COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';

import {
  getExchangeRates,
  transferSigned,
} from 'services/assets';
import CryptoWallet from 'services/cryptoWallet';

import type {
  TokenTransactionPayload,
  CollectibleTransactionPayload,
  TransactionPayload,
} from 'models/Transaction';
import type { Asset, Assets } from 'models/Asset';
import { transformAssetsToObject } from 'utils/assets';
import { delay, noop, uniqBy } from 'utils/common';
import { buildHistoryTransaction, updateAccountHistory } from 'utils/history';
import {
  getActiveAccountAddress,
  getActiveAccount,
  getActiveAccountId,
  getActiveAccountType,
  getAccountAddress,
} from 'utils/accounts';
import { logEventAction } from 'actions/analyticsActions';
import { saveDbAction } from './dbActions';
import { fetchCollectiblesAction } from './collectiblesActions';
import { fetchVirtualAccountBalanceAction } from './smartWalletActions';
import { addExchangeAllowanceAction } from './exchangeActions';

type TransactionStatus = {
  isSuccess: boolean,
  error: ?string,
};

export const sendSignedAssetTransactionAction = (
  transaction: any,
) => {
  return async () => {
    const {
      signedTransaction: { signedHash },
    } = transaction;
    if (!signedHash) return null;
    const transactionHash = await transferSigned(signedHash).catch(e => ({ error: e }));
    if (transactionHash.error) {
      return null;
    }
    return transactionHash;
  };
};

export const signAssetTransactionAction = (
  assetTransaction: TransactionPayload,
  wallet: Object,
) => {
  return async (dispatch: Function, getState: Function) => {
    const tokenType = get(assetTransaction, 'tokenType', '');
    const symbol = get(assetTransaction, 'symbol', '');

    if (tokenType === COLLECTIBLES) {
      await dispatch(fetchCollectiblesAction());
    }

    const {
      accounts: { data: accounts },
      collectibles: { data: collectibles },
    } = getState();

    const accountId = getActiveAccountId(accounts);
    const activeAccount = getActiveAccount(accounts);
    if (!activeAccount) return {};
    const accountCollectibles = collectibles[accountId] || [];

    let signedTransaction;

    // get wallet provider
    const cryptoWallet = new CryptoWallet(wallet.privateKey, activeAccount);
    const walletProvider = await cryptoWallet.getProvider();

    // get only signed transaction
    const transaction = { ...assetTransaction, signOnly: true };

    if (tokenType === COLLECTIBLES) {
      // $FlowFixMe
      const { tokenId } = (assetTransaction: CollectibleTransactionPayload);
      const collectibleInfo = accountCollectibles.find(item => item.id === tokenId);
      if (collectibleInfo) {
        // $FlowFixMe
        signedTransaction = await walletProvider.transferERC721(
          activeAccount,
          // $FlowFixMe
          transaction,
          getState(),
        );
      }
    } else if (symbol === ETH) {
      // $FlowFixMe
      signedTransaction = await walletProvider.transferETH(
        activeAccount,
        // $FlowFixMe
        transaction,
        getState(),
      );
    } else {
      signedTransaction = await walletProvider.transferERC20(
        activeAccount,
        // $FlowFixMe
        transaction,
        getState(),
      );
    }

    // $FlowFixMe
    if (signedTransaction.error) {
      return {};
    }

    // update transaction count
    if (signedTransaction) {
      const { nonce: lastNonce, transactionCount: lastCount } = signedTransaction;
      const txCountNew = { lastCount, lastNonce };
      dispatch({
        type: UPDATE_TX_COUNT,
        payload: txCountNew,
      });
      dispatch(saveDbAction('txCount', { txCount: txCountNew }, true));
    }

    return signedTransaction;
  };
};

export const sendAssetAction = (
  transaction: TransactionPayload,
  wallet: Object,
  navigateToNextScreen: Function = noop,
) => {
  return async (dispatch: Function, getState: Function) => {
    const tokenType = get(transaction, 'tokenType', '');
    const symbol = get(transaction, 'symbol', '');
    const allowancePayload = get(transaction, 'extra.allowance', {});

    if (tokenType === COLLECTIBLES) {
      await dispatch(fetchCollectiblesAction());
    }

    const {
      history: { data: currentHistory },
      accounts: { data: accounts },
      collectibles: { data: collectibles, transactionHistory: collectiblesHistory },
    } = getState();

    const accountId = getActiveAccountId(accounts);
    const activeAccount = getActiveAccount(accounts);
    const accountAddress = getActiveAccountAddress(accounts);
    if (!activeAccount) return;

    let tokenTx = {};
    let historyTx;
    const accountCollectibles = collectibles[accountId] || [];
    const accountCollectiblesHistory = collectiblesHistory[accountId] || [];
    const { to, note } = transaction;

    // get wallet provider
    const cryptoWallet = new CryptoWallet(wallet.privateKey, activeAccount);
    const walletProvider = await cryptoWallet.getProvider();

    // send collectible
    if (tokenType === COLLECTIBLES) {
      // $FlowFixMe
      const { tokenId } = (transaction: CollectibleTransactionPayload);
      const collectibleInfo = accountCollectibles.find(item => item.id === tokenId);
      if (!collectibleInfo) {
        tokenTx = {
          error: 'is not owned',
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

        if (tokenTx.hash) {
          historyTx = {
            ...buildHistoryTransaction({
              ...tokenTx,
              asset: transaction.name,
              note,
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
          value: parseFloat(amount) * (10 ** decimals),
          to, // HACK: in the real ERC20Trx object the 'To' field contains smart contract address
          note,
        });
      }
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
        dispatch({
          type: ADD_TRANSACTION,
          payload: {
            accountId,
            historyTx,
          },
        });
        const accountHistory = currentHistory[accountId] || [];
        const updatedAccountHistory = uniqBy([historyTx, ...accountHistory], 'hash');
        const updatedHistory = updateAccountHistory(currentHistory, accountId, updatedAccountHistory);
        dispatch(saveDbAction('history', { history: updatedHistory }, true));
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
      const { provider, assetCode } = allowancePayload;
      dispatch(addExchangeAllowanceAction(provider, assetCode, tokenTx.hash));
    }

    navigateToNextScreen(txStatus);
  };
};

export const updateAssetsAction = (assets: Assets, assetsToExclude?: string[] = []) => {
  return (dispatch: Function) => {
    const updatedAssets = Object.keys(assets)
      .map(key => assets[key])
      .reduce((memo, item) => {
        if (!assetsToExclude.includes(item.symbol)) {
          memo[item.symbol] = item;
        }
        return memo;
      }, {});
    dispatch(saveDbAction('assets', { assets: updatedAssets }, true));
    dispatch({
      type: UPDATE_ASSETS,
      payload: updatedAssets,
    });
  };
};

export const fetchAssetsBalancesAction = (assets: Assets) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      accounts: { data: accounts },
      balances: { data: balances },
      featureFlags: { data: { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } },
    } = getState();

    const walletAddress = getActiveAccountAddress(accounts);
    const accountId = getActiveAccountId(accounts);
    const activeAccountType = getActiveAccountType(accounts);
    dispatch({
      type: UPDATE_ASSETS_STATE,
      payload: FETCHING,
    });

    const newBalances = await api.fetchBalances({ address: walletAddress, assets: Object.values(assets) });
    if (newBalances && newBalances.length) {
      const transformedBalances = transformAssetsToObject(newBalances);
      const updatedBalances = {
        ...balances,
        [accountId]: transformedBalances,
      };
      dispatch(saveDbAction('balances', { balances: updatedBalances }, true));
      dispatch({
        type: UPDATE_BALANCES,
        payload: updatedBalances,
      });
    }

    // @TODO: Extract "rates fetching" to its own action ones required.
    const rates = await getExchangeRates(Object.keys(assets));
    if (rates && Object.keys(rates).length) {
      dispatch(saveDbAction('rates', { rates }, true));
      dispatch({ type: UPDATE_RATES, payload: rates });
    }

    if (smartWalletFeatureEnabled && activeAccountType === ACCOUNT_TYPES.SMART_WALLET) {
      dispatch(fetchVirtualAccountBalanceAction());
    }
  };
};

export const fetchInitialAssetsAction = () => {
  return async (dispatch: Function, getState: () => Object, api: Object) => {
    const { user: { data: { walletId } } } = getState();
    dispatch({
      type: UPDATE_ASSETS_STATE,
      payload: FETCHING_INITIAL,
    });
    await delay(1000);
    const initialAssets = await api.fetchInitialAssets(walletId);

    if (!Object.keys(initialAssets).length) {
      dispatch({
        type: UPDATE_ASSETS_STATE,
        payload: FETCH_INITIAL_FAILED,
      });
      return;
    }

    dispatch({
      type: SET_INITIAL_ASSETS,
      payload: initialAssets,
    });

    dispatch(fetchAssetsBalancesAction(initialAssets));
  };
};

export const addAssetAction = (asset: Asset) => {
  return async (dispatch: Function, getState: () => Object) => {
    const {
      assets: { data: assets },
    } = getState();
    const updatedAssets = { ...assets, [asset.symbol]: { ...asset } };

    dispatch(saveDbAction('assets', { assets: updatedAssets }));
    dispatch({ type: UPDATE_ASSETS, payload: updatedAssets });
    dispatch(fetchAssetsBalancesAction(assets));

    dispatch(logEventAction('asset_token_added', { symbol: asset.symbol }));
  };
};

export const removeAssetAction = (asset: Object) => ({
  type: REMOVE_ASSET,
  payload: asset,
});

export const startAssetsSearchAction = () => ({
  type: START_ASSETS_SEARCH,
});

export const searchAssetsAction = (query: string) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { user: { data: { walletId } } } = getState();

    const assets = await api.assetsSearch(query, walletId);

    dispatch({
      type: UPDATE_ASSETS_SEARCH_RESULT,
      payload: assets,
    });
  };
};

export const resetSearchAssetsResultAction = () => ({
  type: RESET_ASSETS_SEARCH_RESULT,
});

export const checkForMissedAssetsAction = (transactionNotifications: Object[]) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const {
      user: { data: { walletId } },
      assets: { data: currentAssets, supportedAssets },
      wallet: { data: wallet },
    } = getState();

    // load supported assets
    let walletSupportedAssets = [...supportedAssets];
    if (!supportedAssets.length) {
      walletSupportedAssets = await api.fetchSupportedAssets(walletId);
      dispatch({
        type: UPDATE_SUPPORTED_ASSETS,
        payload: walletSupportedAssets,
      });
      const currentAssetsTickers = Object.keys(currentAssets);

      // HACK: Dirty fix for users who removed somehow Eth from their assets list
      if (!currentAssetsTickers.includes(ETH)) currentAssetsTickers.push(ETH);

      if (walletSupportedAssets.length) {
        const updatedAssets = walletSupportedAssets
          .filter(asset => currentAssetsTickers.includes(asset.symbol))
          .reduce((memo, asset) => ({ ...memo, [asset.symbol]: asset }), {});
        dispatch({
          type: UPDATE_ASSETS,
          payload: updatedAssets,
        });
        dispatch(saveDbAction('assets', { assets: updatedAssets }, true));
      }
    }

    // check if some assets are not enabled
    const myAddress = wallet.address.toUpperCase();
    const missedAssets = transactionNotifications
      .filter(tx => tx.from.toUpperCase() !== myAddress)
      .reduce((memo, { asset: ticker }) => {
        if (!ticker) return memo;
        if (memo[ticker] !== undefined || currentAssets[ticker] !== undefined) return memo;

        const supportedAsset = walletSupportedAssets.find(asset => asset.symbol === ticker);
        if (supportedAsset) {
          memo[ticker] = supportedAsset;
        }
        return memo;
      }, {});

    if (Object.keys(missedAssets).length) {
      const newAssets = { ...currentAssets, ...missedAssets };
      dispatch(updateAssetsAction(newAssets));
      dispatch(fetchAssetsBalancesAction(newAssets));
    }
  };
};

export const resetLocalNonceToTransactionCountAction = (wallet: Object) => {
  return async (dispatch: Function, getState: Function) => {
    const {
      accounts: { data: accounts },
    } = getState();
    const activeAccount = getActiveAccount(accounts);
    if (!activeAccount) return;
    const accountAddress = getAccountAddress(activeAccount);
    const cryptoWallet = new CryptoWallet(wallet.privateKey, activeAccount);
    const walletProvider = await cryptoWallet.getProvider();
    const transactionCount = await walletProvider.getTransactionCount(accountAddress);
    const txCountNew = {
      lastCount: transactionCount,
      lastNonce: transactionCount - 1,
    };
    await dispatch({
      type: UPDATE_TX_COUNT,
      payload: txCountNew,
    });
    dispatch(saveDbAction('txCount', { txCount: txCountNew }, true));
  };
};
