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
import { BigNumber } from 'bignumber.js';
import { Sentry } from 'react-native-sentry';
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
} from 'constants/assetsConstants';
import { UPDATE_TX_COUNT } from 'constants/txCountConstants';
import { ADD_TRANSACTION, TX_CONFIRMED_STATUS, TX_PENDING_STATUS } from 'constants/historyConstants';
import { UPDATE_RATES } from 'constants/ratesConstants';
import { ADD_COLLECTIBLE_TRANSACTION, COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import { PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS } from 'constants/paymentNetworkConstants';

import Toast from 'components/Toast';

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
import type { Asset, AssetsByAccount, Balance, Balances } from 'models/Asset';
import type { Account } from 'models/Account';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import { transformAssetsToObject } from 'utils/assets';
import { delay, noop, uniqBy } from 'utils/common';
import { buildHistoryTransaction, updateAccountHistory } from 'utils/history';
import {
  getActiveAccountAddress,
  getActiveAccount,
  getActiveAccountId,
  getActiveAccountType,
  getAccountAddress,
  getAccountId,
  checkIfSmartWalletAccount,
} from 'utils/accounts';
import { findMatchingContact } from 'utils/contacts';
import { accountBalancesSelector } from 'selectors/balances';
import { accountAssetsSelector } from 'selectors/assets';
import { logEventAction } from 'actions/analyticsActions';
import SDKWrapper from 'services/api';
import { saveDbAction } from './dbActions';
import { fetchCollectiblesAction } from './collectiblesActions';
import { ensureSmartAccountConnectedAction, fetchVirtualAccountBalanceAction } from './smartWalletActions';
import { addExchangeAllowanceAction } from './exchangeActions';
import { sendTxNoteByContactAction } from './txNoteActions';
import { showAssetAction } from './userSettingsActions';

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
    if (!activeAccount) return;

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
      const {
        contacts: {
          data: contacts,
          contactsSmartAddresses: { addresses: contactsSmartAddresses },
        },
      } = getState();
      const toUser = findMatchingContact(to, contacts, contactsSmartAddresses);
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

export const fetchAssetsBalancesAction = (showToastIfIncreased?: boolean) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      accounts: { data: accounts },
      balances: { data: balances },
      featureFlags: { data: { SMART_WALLET_ENABLED: smartWalletFeatureEnabled } },
    } = getState();

    const activeAccount = getActiveAccount(accounts);
    if (!activeAccount) return;
    const walletAddress = getAccountAddress(activeAccount);
    const accountId = getAccountId(activeAccount);
    if (!walletAddress || !accountId) return;
    const accountAssets = accountAssetsSelector(getState());
    const isSmartWalletAccount = checkIfSmartWalletAccount(activeAccount);

    dispatch({
      type: UPDATE_ASSETS_STATE,
      payload: FETCHING,
    });

    const newBalances = await api.fetchBalances({
      address: walletAddress,
      // $FlowFixMe Object.values returns mixed type
      assets: Object.values(accountAssets),
    });

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
    const rates = await getExchangeRates(Object.keys(accountAssets));
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
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: { walletId } },
      accounts: { data: accounts },
    } = getState();

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
    const activeAccountId = getActiveAccountId(accounts);
    dispatch({
      type: SET_INITIAL_ASSETS,
      payload: {
        accountId: activeAccountId,
        assets: initialAssets,
      },
    });
    dispatch(fetchAssetsBalancesAction(true));
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
      title: null,
      message: `${asset.name} (${asset.symbol}) has been added`,
      type: 'info',
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

export const getSupportedTokens = (supportedAssets: Asset[], accountsAssets: AssetsByAccount, account: Account) => {
  const accountId = getAccountId(account);
  const accountAssets = get(accountsAssets, accountId, {});
  const accountAssetsTickers = Object.keys(accountAssets);

  // HACK: Dirty fix for users who removed somehow ETH and PLR from their assets list
  if (!accountAssetsTickers.includes(ETH)) accountAssetsTickers.push(ETH);
  if (!accountAssetsTickers.includes(PLR)) accountAssetsTickers.push(PLR);

  // TODO: remove when we find an issue with supported assets
  if (!supportedAssets || !supportedAssets.length) {
    Sentry.captureMessage('Wrong supported assets received', { level: 'info', extra: { supportedAssets } });
    return { id: accountId };
  }

  const updatedAccountAssets = supportedAssets
    .filter(asset => accountAssetsTickers.includes(asset.symbol))
    .reduce((memo, asset) => ({ ...memo, [asset.symbol]: asset }), {});
  return { id: accountId, ...updatedAccountAssets };
};

const getAllOwnedAssets = async (api: SDKWrapper, accountId: string, supportedAssets: Asset[]) => {
  const addressErc20Tokens = await api.getAddressErc20TokensInfo(accountId); // all address' assets except ETH;
  const accOwnedErc20Assets = {};
  if (addressErc20Tokens.length) {
    addressErc20Tokens.forEach((token) => {
      const tokenTicker = get(token, 'tokenInfo.symbol', '');
      const supportedAsset = supportedAssets.find(asset => asset.symbol === tokenTicker);
      if (supportedAsset && !accOwnedErc20Assets[tokenTicker]) accOwnedErc20Assets[tokenTicker] = supportedAsset;
    });
  }
  return accOwnedErc20Assets;
};

export const checkForMissedAssetsAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      accounts: { data: accounts },
      user: { data: { walletId } },
      assets: { data: accountsAssets, supportedAssets = [] },
      session: { data: { isOnline } },
    } = getState();

    // load supported assets
    let walletSupportedAssets = [...supportedAssets];
    if (isOnline) {
      const apiSupportedAssets = await api.fetchSupportedAssets(walletId);
      if (!isEmpty(apiSupportedAssets)) {
        walletSupportedAssets = [...apiSupportedAssets];
        dispatch({
          type: UPDATE_SUPPORTED_ASSETS,
          payload: walletSupportedAssets,
        });
      }
    }

    const allSupportedAddedAssetsByAccount = accounts
      .map((acc) => getSupportedTokens(walletSupportedAssets, accountsAssets, acc))
      .reduce((obj, { id, ...rest }) => {
        obj[id] = rest;
        return obj;
      }, {});

    // check if some assets are not enabled
    const ownedAssetsByAccount = await Promise.all(accounts.map(async (acc) => {
      const accountId = getAccountId(acc);
      const ownedAssets = await getAllOwnedAssets(api, accountId, walletSupportedAssets);
      return { id: accountId, ...ownedAssets };
    }));

    const reducedOwnedAssetsByAccount = ownedAssetsByAccount.reduce((obj, { id, ...rest }) => {
      obj[id] = rest;
      return obj;
    }, {});

    const updatedAssets = Object.keys(allSupportedAddedAssetsByAccount).map((acc) => {
      return { id: acc, ...allSupportedAddedAssetsByAccount[acc], ...reducedOwnedAssetsByAccount[acc] };
    }).reduce((obj, { id, ...rest }) => {
      obj[id] = rest;
      return obj;
    }, {});

    dispatch({
      type: UPDATE_ASSETS,
      payload: updatedAssets,
    });
    dispatch(fetchAssetsBalancesAction());
    dispatch(saveDbAction('assets', { assets: updatedAssets }, true));
    dispatch(saveDbAction('supportedAssets', { supportedAssets: walletSupportedAssets }, true));
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
