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
import { BigNumber } from 'bignumber.js';
import { utils } from 'ethers';
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
  PLR,
} from 'constants/assetsConstants';
import { UPDATE_TX_COUNT } from 'constants/txCountConstants';
import { ADD_TRANSACTION, TX_CONFIRMED_STATUS, TX_PENDING_STATUS } from 'constants/historyConstants';
import { UPDATE_RATES } from 'constants/ratesConstants';
import { ADD_COLLECTIBLE_TRANSACTION, COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import { PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS } from 'constants/paymentNetworkConstants';
import { SEND_TOKEN_CONFIRM } from 'constants/navigationConstants';

import Toast from 'components/Toast';

import {
  getExchangeRates,
  transferSigned,
  getTransactionNonceByHash,
} from 'services/assets';
import CryptoWallet from 'services/cryptoWallet';
import { navigate } from 'services/navigation';

import type {
  TokenTransactionPayload,
  CollectibleTransactionPayload,
  TransactionPayload,
} from 'models/Transaction';
import type { Asset, Assets, Balance, Balances } from 'models/Asset';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import { addressesEqual, transformAssetsToObject } from 'utils/assets';
import { delay, formatFullAmount, formatUnits, isCaseInsensitiveMatch, noop, uniqBy } from 'utils/common';
import { buildHistoryTransaction, updateAccountHistory } from 'utils/history';
import {
  getActiveAccountAddress,
  getActiveAccount,
  getActiveAccountId,
  getActiveAccountType,
  getAccountAddress,
  checkIfSmartWalletAccount,
} from 'utils/accounts';
import { accountBalancesSelector } from 'selectors/balances';
import { logEventAction } from 'actions/analyticsActions';
import { saveDbAction } from './dbActions';
import { fetchCollectiblesAction } from './collectiblesActions';
import { ensureSmartAccountConnectedAction, fetchVirtualAccountBalanceAction } from './smartWalletActions';
import { addExchangeAllowanceAction } from './exchangeActions';
import { sendTxNoteByContactAction } from './txNoteActions';

type TransactionStatus = {
  isSuccess: boolean,
  error: ?string,
};

export const sendSignedAssetTransactionAction = (transaction: any) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      signedTransaction: { signedHash },
      transaction: transactionDetails,
    } = transaction;
    if (!signedHash) return null;

    const transactionHash = await transferSigned(signedHash).catch(e => ({ error: e }));
    if (transactionHash && transactionHash.error) {
      return null;
    }

    // add tx to tx history
    try {
      const {
        collectibles: { data: collectibles, transactionHistory: collectiblesHistory },
        history: { data: currentHistory },
        accounts: { data: accounts },
      } = getState();
      const accountId = getActiveAccountId(accounts);
      const accountAddress = getActiveAccountAddress(accounts);
      const accountCollectibles = collectibles[accountId] || [];
      const accountCollectiblesHistory = collectiblesHistory[accountId] || [];

      let historyTx;
      if (transactionDetails.tokenType === COLLECTIBLES) {
        const collectibleInfo = accountCollectibles.find(item => item.id === transactionDetails.tokenId) || {};
        historyTx = {
          ...buildHistoryTransaction({
            from: accountAddress,
            to: transactionDetails.to,
            hash: transactionHash,
            asset: transactionDetails.name,
            value: '1',
            gasPrice: new BigNumber(transactionDetails.gasPrice),
            gasLimit: transactionDetails.gasLimit,
          }),
          assetData: { ...collectibleInfo },
          type: COLLECTIBLE_TRANSACTION,
          icon: collectibleInfo.icon,
        };

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
        const value = parseFloat(transactionDetails.amount) * (10 ** transactionDetails.decimals);
        historyTx = buildHistoryTransaction({
          from: accountAddress,
          to: transactionDetails.to,
          hash: transactionHash,
          value: value.toString(),
          asset: transactionDetails.symbol,
          gasPrice: new BigNumber(transactionDetails.gasPrice),
          gasLimit: transactionDetails.gasLimit,
        });

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
    } catch (e) {
      console.log({ e });
    }

    return transactionHash;
  };
};

export const signAssetTransactionAction = (
  assetTransaction: TransactionPayload,
  wallet: Object,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
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
  callback: Function = noop,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const tokenType = get(transaction, 'tokenType', '');
    const symbol = get(transaction, 'symbol', '');
    const allowancePayload = get(transaction, 'extra.allowance', {});
    const usePPN = get(transaction, 'usePPN', false);

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
    if (!activeAccount) {
      callback({
        isSuccess: false,
        error: 'Failed to get wallet account',
        noRetry: true,
      });
      return;
    }

    if (activeAccountType === ACCOUNT_TYPES.SMART_WALLET) {
      await dispatch(ensureSmartAccountConnectedAction(wallet.privateKey));
    }

    let tokenTx = {};
    let historyTx;
    const accountCollectibles = collectibles[accountId] || [];
    const accountCollectiblesHistory = collectiblesHistory[accountId] || [];
    const { to, note } = transaction;

    // get wallet provider
    const cryptoWallet = new CryptoWallet(wallet.privateKey, activeAccount);
    const walletProvider = await cryptoWallet.getProvider();

    if (transaction.replaceTransaction) {
      const existingNonce = await getTransactionNonceByHash(transaction.replaceTransaction);
      if (existingNonce === null) {
        callback({
          isSuccess: false,
          error: 'Cannot get nonce for transaction speed up',
          noRetry: false,
        });
        return;
      }
      // $FlowFixMe
      transaction = { ...transaction, nonce: existingNonce };
    }

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
          gasPrice: transaction.gasPrice,
          gasLimit: transaction.gasLimit,
          isPPNTransaction: usePPN,
          status: usePPN ? TX_CONFIRMED_STATUS : TX_PENDING_STATUS,
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
          gasPrice: transaction.gasPrice,
          gasLimit: transaction.gasLimit,
          isPPNTransaction: usePPN,
          status: usePPN ? TX_CONFIRMED_STATUS : TX_PENDING_STATUS,
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
        dispatch({
          type: ADD_TRANSACTION,
          payload: {
            accountId,
            historyTx,
          },
        });
        const { history: { data: currentHistory } } = getState();
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

    // send note
    if (tokenTx.hash && note) {
      const { contacts: { data: contacts } } = getState();
      const toUser = contacts.find(contact => addressesEqual(contact.ethAddress, to));
      if (toUser) {
        dispatch(sendTxNoteByContactAction(toUser.username, {
          text: note,
          txHash: tokenTx.hash,
        }));
      }
    }

    callback(txStatus);
  };
};

export const updateAssetsAction = (assets: Assets, assetsToExclude?: string[] = []) => {
  return (dispatch: Dispatch) => {
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

function notifyAboutIncreasedBalance(newBalances: Balance[], oldBalances: Balances) {
  const increasedBalances = newBalances
    .filter(({ balance, symbol }) => {
      const oldTokenBalance = get(oldBalances, [symbol, 'balance'], 0);
      return oldTokenBalance && parseFloat(balance) > parseFloat(oldTokenBalance);
    });
  if (increasedBalances.length) {
    Toast.show({ message: 'Your assets balance increased', type: 'success', title: 'Success' });
  }
}

export const fetchAssetsBalancesAction = (assets: Assets, showToastIfIncreased?: boolean) => {
  return async (dispatch: Dispatch, getState: GetState, api: Object) => {
    const {
      accounts: { data: accounts },
      balances: { data: balances },
      featureFlags: { data: { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } },
    } = getState();

    const activeAccount = getActiveAccount(accounts);
    if (!activeAccount) return;

    const walletAddress = getActiveAccountAddress(accounts);
    const accountId = getActiveAccountId(accounts);
    const isSmartWalletAccount = checkIfSmartWalletAccount(activeAccount);

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
      if (showToastIfIncreased && !isSmartWalletAccount) {
        const currentBalances = accountBalancesSelector(getState());
        notifyAboutIncreasedBalance(newBalances, currentBalances);
      }
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

    if (smartWalletFeatureEnabled && isSmartWalletAccount) {
      dispatch(fetchVirtualAccountBalanceAction());
    }
  };
};

export const fetchInitialAssetsAction = () => {
  return async (dispatch: Dispatch, getState: () => Object, api: Object) => {
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
  return async (dispatch: Dispatch, getState: () => Object) => {
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

export const removeAssetAction = (asset: Asset) => {
  return async (dispatch: Dispatch, getState: () => Object) => {
    const {
      assets: { data: assets },
    } = getState();

    const updatedAssets = Object.keys(assets).reduce((object, key) => {
      if (key !== asset.symbol) {
        object[key] = assets[key];
      }
      return object;
    }, {});

    dispatch(saveDbAction('assets', { assets: updatedAssets }, true));
    dispatch({ type: REMOVE_ASSET, payload: asset });
  };
};

export const startAssetsSearchAction = () => ({
  type: START_ASSETS_SEARCH,
});

export const searchAssetsAction = (query: string) => {
  return async (dispatch: Dispatch, getState: GetState, api: Object) => {
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
  return async (dispatch: Dispatch, getState: GetState, api: Object) => {
    const {
      accounts: { data: accounts },
      user: { data: { walletId } },
      assets: { data: currentAssets, supportedAssets },
    } = getState();
    const activeAccountAddress = getActiveAccountAddress(accounts);

    // load supported assets
    let walletSupportedAssets = [...supportedAssets];
    if (!supportedAssets.length) {
      walletSupportedAssets = await api.fetchSupportedAssets(walletId);
      dispatch({
        type: UPDATE_SUPPORTED_ASSETS,
        payload: walletSupportedAssets,
      });
      const currentAssetsTickers = Object.keys(currentAssets);

      // HACK: Dirty fix for users who removed somehow ETH and PLR from their assets list
      if (!currentAssetsTickers.includes(ETH)) currentAssetsTickers.push(ETH);
      if (!currentAssetsTickers.includes(PLR)) currentAssetsTickers.push(PLR);

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
    const missedAssets = transactionNotifications
      .filter(tx => !addressesEqual(tx.from, activeAccountAddress))
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
  return async (dispatch: Dispatch, getState: GetState) => {
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

export const speedUpTransactionAction = (transactionHash: string, gasPriceGwei: number, gasLimit: number) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      history: { data: history },
      accounts: { data: accounts },
      assets: { data: assets },
    } = getState();
    const accountAddress = getActiveAccountAddress(accounts);
    const transactionInfo = (history[accountAddress] || []).find(
      ({ hash }) => isCaseInsensitiveMatch(hash, transactionHash),
    );
    if (!transactionInfo) {
      Toast.show({
        message: 'Cannot speed up transaction',
        type: 'warning',
        title: 'Failed',
        autoClose: false,
      });
      return;
    }
    const txFeeInWei = utils
      .parseUnits(gasPriceGwei.toString(), 'gwei')
      .mul(gasLimit);
    const gasPrice = txFeeInWei.div(gasLimit).toNumber();
    const {
      to,
      from,
      asset: assetSymbol,
      note,
      value,
    } = transactionInfo;
    // $FlowFixMe
    const asset: Asset = Object.values(assets).find(({ symbol }) => symbol === assetSymbol) || {};
    const {
      symbol,
      address: contractAddress,
      decimals,
    } = asset;
    const amount = formatFullAmount(formatUnits(value, decimals));
    const transactionPayload = {
      to,
      amount,
      gasLimit,
      gasPrice,
      txFeeInWei,
      symbol,
      contractAddress,
      decimals,
      from,
      replaceTransaction: transactionHash,
    };
    navigate(SEND_TOKEN_CONFIRM, {
      transactionPayload,
      source: from,
      defaultNote: note,
    });
  };
};
