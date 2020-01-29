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
import { ADD_COLLECTIBLE_TRANSACTION, COLLECTIBLE_TRANSACTION } from 'constants/collectiblesConstants';
import { PAYMENT_NETWORK_SUBSCRIBE_TO_TX_STATUS } from 'constants/paymentNetworkConstants';

import Toast from 'components/Toast';

import { initialAssets as assetFixtures } from 'fixtures/assets';

import { transferSigned } from 'services/assets';
import CryptoWallet from 'services/cryptoWallet';

import type {
  TokenTransactionPayload,
  CollectibleTransactionPayload,
  TransactionPayload,
  SyntheticTransaction,
} from 'models/Transaction';
import type { Asset, AssetsByAccount, Balance, Balances } from 'models/Asset';
import type { Account } from 'models/Account';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import { getAssetsAsList, transformAssetsToObject } from 'utils/assets';
import { delay, noop, parseTokenAmount, uniqBy } from 'utils/common';
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
import { commitSyntheticsTransaction } from 'actions/syntheticsActions';
import SDKWrapper from 'services/api';
import { saveDbAction } from './dbActions';
import { fetchCollectiblesAction } from './collectiblesActions';
import { ensureSmartAccountConnectedAction, fetchVirtualAccountBalanceAction } from './smartWalletActions';
import { addExchangeAllowanceAction } from './exchangeActions';
import { sendTxNoteByContactAction } from './txNoteActions';
import { showAssetAction } from './userSettingsActions';
import { fetchAccountAssetsRatesAction } from './ratesActions';
import { addEnsRegistryRecordAction } from './ensRegistryActions';

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

    const transactionResult = await transferSigned(signedHash).catch(e => ({ error: e }));
    if (isEmpty(transactionResult) || !transactionResult.hash) {
      return null;
    }

    const { hash: transactionHash } = transactionResult;

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
        const value = parseTokenAmount(transactionDetails.amount, transactionDetails.decimals);
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
          value: parseTokenAmount(amount, decimals),
          to, // HACK: in the real ERC20Trx object the 'To' field contains smart contract address
          note,
          gasPrice: transaction.gasPrice,
          gasLimit: transaction.gasLimit,
          isPPNTransaction: usePPN,
          status: usePPN ? TX_CONFIRMED_STATUS : TX_PENDING_STATUS,
          extra: transaction.extra || null,
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
            Sentry.captureMessage(
              'Failed to get transactionId during synthetics exchange.',
              { extra: { hash: historyTx.hash } },
            );
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
      assets: getAssetsAsList(accountAssets),
    });

    if (!isEmpty(newBalances)) {
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

    dispatch(fetchAccountAssetsRatesAction());

    if (smartWalletFeatureEnabled && isSmartWalletAccount) {
      dispatch(fetchVirtualAccountBalanceAction());
    }
  };
};

export const fetchInitialAssetsAction = (showToastIfIncreased?: boolean = true) => {
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
    dispatch(fetchAssetsBalancesAction(showToastIfIncreased));
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

    if (supportedAssets && !supportedAssets.some(e => e.symbol === 'BTC')) {
      const btcAsset = assetFixtures.find(e => e.symbol === 'BTC');
      if (btcAsset) {
        supportedAssets.push(btcAsset);
      }
    }

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
      .map((acc) => getSupportedTokens(walletSupportedAssets, accountsAssets, acc))
      .reduce((memo, { id, ...rest }) => ({ ...memo, [id]: rest }), {});

    // check tx history if some assets are not enabled
    const ownedAssetsByAccount = await Promise.all(accounts.map(async (acc) => {
      const accountId = getAccountId(acc);
      const ownedAssets = await getAllOwnedAssets(api, accountId, walletSupportedAssets);
      return { id: accountId, ...ownedAssets };
    }));

    const allAccountAssets = ownedAssetsByAccount
      .reduce((memo, { id, ...rest }) => ({ ...memo, [id]: rest }), {});

    const updatedAssets = Object.keys(accountUpdatedAssets)
      .map((acc) => ({ id: acc, ...accountUpdatedAssets[acc], ...allAccountAssets[acc] }))
      .reduce((memo, { id, ...rest }) => ({ ...memo, [id]: rest }), {});

    dispatch({
      type: UPDATE_ASSETS,
      payload: updatedAssets,
    });
    dispatch(fetchAssetsBalancesAction());
    dispatch(saveDbAction('assets', { assets: updatedAssets }, true));
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
