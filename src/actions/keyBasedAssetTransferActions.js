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
import { Wallet } from 'ethers';

// constants
import { COLLECTIBLES, ETH } from 'constants/assetsConstants';
import {
  SET_FETCHING_AVAILABLE_KEY_BASED_BALANCES_TO_TRANSFER,
  SET_FETCHING_AVAILABLE_KEY_BASED_COLLECTIBLES_TO_TRANSFER,
  SET_KEY_BASED_ASSETS_TO_TRANSFER,
  SET_AVAILABLE_KEY_BASED_BALANCES_TO_TRANSFER,
  SET_AVAILABLE_KEY_BASED_COLLECTIBLES_TO_TRANSFER,
  SET_CALCULATING_KEY_BASED_ASSETS_TO_TRANSFER_GAS,
} from 'constants/keyBasedAssetTransferConstants';
import { UPDATE_TX_COUNT } from 'constants/txCountConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// actions
import { getAllOwnedAssets } from 'actions/assetsActions';
import { collectibleFromResponse } from 'actions/collectiblesActions';
import { saveDbAction } from 'actions/dbActions';

// utils
import { getAssetsAsList, transformBalancesToObject } from 'utils/assets';
import { reportLog } from 'utils/common';
import { findFirstSmartAccount, getAccountAddress } from 'utils/accounts';

// services
import { calculateGasEstimate } from 'services/assets';
import CryptoWallet from 'services/cryptoWallet';

// types
import type SDKWrapper from 'services/api';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { Collectible } from 'models/Collectible';
import type { Asset, KeyBasedAssetTransfer } from 'models/Asset';
import type { Account } from 'models/Account';


const buildAssetTransferTransaction = (asset: Asset | Collectible, transactionExtra: Object) => {
  if (asset?.tokenType === COLLECTIBLES) {
    const { id: tokenId, contractAddress } = asset;
    return { tokenId, contractAddress, ...transactionExtra };
  }
  const {
    symbol,
    address: contractAddress,
    decimals,
    amount,
  } = asset;
  return {
    symbol,
    contractAddress,
    decimals,
    amount,
    ...transactionExtra,
  };
};

const signKeyBasedAssetTransferTransaction = async (
  keyBasedAssetTransfer: KeyBasedAssetTransfer,
  wallet: Wallet,
  dispatch: Dispatch,
  getState: GetState,
) => {
  // only temporary mock, used for type checking and retrieving addresses in calls below
  const keyBasedAccount: Account = {
    id: wallet.address,
    type: ACCOUNT_TYPES.KEY_BASED,
    isActive: false,
    walletId: '',
  };

  const cryptoWallet = new CryptoWallet(wallet.privateKey, keyBasedAccount);
  const walletProvider = await cryptoWallet.getProvider();

  const {
    wallet: { data: { address: keyBasedWalletAddress } },
    accounts: { data: accounts },
  } = getState();

  // get only signed transaction
  const transaction = buildAssetTransferTransaction(keyBasedAssetTransfer.asset, {
    from: keyBasedWalletAddress,
    to: getAccountAddress(findFirstSmartAccount(accounts)),
    signOnly: true,
  });

  let signedTransaction;
  if (keyBasedAssetTransfer?.asset?.tokenType === COLLECTIBLES) {
    signedTransaction = await walletProvider.transferERC721(
      keyBasedAccount,
      transaction,
      getState(),
    );
  } else if (keyBasedAssetTransfer?.asset?.symbol === ETH) {
    signedTransaction = await walletProvider.transferETH(
      keyBasedAccount,
      transaction,
      getState(),
    );
  } else {
    signedTransaction = await walletProvider.transferERC20(
      keyBasedAccount,
      transaction,
      getState(),
    );
  }

  if (!signedTransaction || signedTransaction.error) {
    reportLog('Failed to create key based asset transfer transaction', {
      keyBasedAssetTransfer,
      error: signedTransaction?.error,
    });
    return null;
  }

  // update local transaction count
  const { nonce: lastNonce, transactionCount: lastCount } = signedTransaction;
  const txCountNew = { lastCount, lastNonce };
  dispatch({ type: UPDATE_TX_COUNT, payload: txCountNew });
  dispatch(saveDbAction('txCount', { txCount: txCountNew }, true));

  return signedTransaction;
};

export const removeKeyBasedAssetToTransferAction = (asset: Asset | Collectible) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { keyBasedAssetTransfer: { data: keyBasedAssetsToTransfer } } = getState();

    // filter out matching
    const updatedKeyBasedAssetsToTransfer = keyBasedAssetsToTransfer.filter(({ asset: transferAssetData }) => {
      if (transferAssetData?.tokenType !== COLLECTIBLES) return transferAssetData?.symbol !== asset.symbol;
      return transferAssetData?.id !== asset?.id
        || (transferAssetData?.id !== asset?.id && transferAssetData?.contractAddress !== asset?.contractAddress);
    });

    dispatch({ type: SET_KEY_BASED_ASSETS_TO_TRANSFER, payload: updatedKeyBasedAssetsToTransfer });
  };
};

export const addKeyBasedAssetToTransferAction = (asset: Asset | Collectible) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { keyBasedAssetTransfer: { data: keyBasedAssetsToTransfer } } = getState();
    const updatedKeyBasedAssetsToTransfer = keyBasedAssetsToTransfer.concat({ asset });
    dispatch({ type: SET_KEY_BASED_ASSETS_TO_TRANSFER, payload: updatedKeyBasedAssetsToTransfer });
  };
};

export const fetchAvailableBalancesToTransferAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      wallet: { data: { address: keyBasedWalletAddress } },
      assets: { supportedAssets },
    } = getState();
    dispatch({ type: SET_FETCHING_AVAILABLE_KEY_BASED_BALANCES_TO_TRANSFER });

    // fetch key based assets
    const ownedAssets = await getAllOwnedAssets(api, keyBasedWalletAddress, supportedAssets);
    const availableBalances = await api.fetchBalances({
      address: keyBasedWalletAddress,
      assets: getAssetsAsList(ownedAssets),
    });

    dispatch({
      type: SET_AVAILABLE_KEY_BASED_BALANCES_TO_TRANSFER,
      payload: transformBalancesToObject(availableBalances),
    });
  };
};

export const fetchAvailableCollectiblesToTransferAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const { wallet: { data: { address: keyBasedWalletAddress } } } = getState();

    dispatch({ type: SET_FETCHING_AVAILABLE_KEY_BASED_COLLECTIBLES_TO_TRANSFER });

    let availableCollectibles = [];

    const fetchedCollectibles = await api.fetchCollectibles(keyBasedWalletAddress);
    if (fetchedCollectibles.error || !fetchedCollectibles.assets) {
      reportLog('Failed to fetch key based wallet collectibles', { requestResult: fetchedCollectibles });
    } else {
      availableCollectibles = fetchedCollectibles.assets.map(collectibleFromResponse);
    }

    dispatch({ type: SET_AVAILABLE_KEY_BASED_COLLECTIBLES_TO_TRANSFER, payload: availableCollectibles });
  };
};

export const setAndStoreKeyBasedAssetsToTransferAction = (keyBasedAssetsToTransfer: KeyBasedAssetTransfer[]) => {
  return (dispatch: Dispatch) => {
    dispatch(saveDbAction('keyBasedAssetTransfer', { keyBasedAssetsToTransfer }));
    dispatch({ type: SET_KEY_BASED_ASSETS_TO_TRANSFER, payload: keyBasedAssetsToTransfer });
  };
};

export const calculateKeyBasedAssetsToTransferTransactionGasAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      wallet: { data: { address: keyBasedWalletAddress } },
      accounts: { data: accounts },
      keyBasedAssetTransfer: { data: keyBasedAssetsToTransfer, isCalculatingGas },
    } = getState();

    if (isCalculatingGas) return;
    dispatch({ type: SET_CALCULATING_KEY_BASED_ASSETS_TO_TRANSFER_GAS, payload: true });

    const keyBasedAssetsToTransferUpdated = await Promise.all(
      keyBasedAssetsToTransfer.map(async (keyBasedAssetToTransfer) => {
        const { asset } = keyBasedAssetToTransfer;
        const estimateTransaction = buildAssetTransferTransaction(asset, {
          from: keyBasedWalletAddress,
          to: getAccountAddress(findFirstSmartAccount(accounts)),
        });
        const gasLimit = await calculateGasEstimate(estimateTransaction);
        return { ...keyBasedAssetToTransfer, calculatedGasLimit: gasLimit };
      }),
    );

    dispatch({ type: SET_KEY_BASED_ASSETS_TO_TRANSFER, payload: keyBasedAssetsToTransferUpdated });
    dispatch({ type: SET_CALCULATING_KEY_BASED_ASSETS_TO_TRANSFER_GAS, payload: false });
  };
};

export const createKeyBasedAssetsToTransferTransactionsAction = (wallet: Wallet) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { keyBasedAssetTransfer: { data: keyBasedAssetsToTransfer } } = getState();
    /**
     * we need this to be sequential and wait for each to complete because of local nonce increment
     * side note: eslint ignored because of "async for" not allowed, however, we need it for sequential calls
     */
    const keyBasedAssetsToTransferUpdated = [];
    for (const keyBasedAssetTransfer of keyBasedAssetsToTransfer) { // eslint-disable-line
      const signedTransaction = await signKeyBasedAssetTransferTransaction( // eslint-disable-line
        keyBasedAssetTransfer,
        wallet,
        dispatch,
        getState,
      );
      if (signedTransaction) keyBasedAssetsToTransferUpdated.push({ ...keyBasedAssetTransfer, signedTransaction });
    }

    dispatch(setAndStoreKeyBasedAssetsToTransferAction(keyBasedAssetsToTransferUpdated));
  };
};

// export const checkAssetTransferTransactionsAction = () => {
//   return async (dispatch: Function, getState: Function) => {
//     const {
//       assets: { data: assets },
//       history: {
//         data: transactionsHistory,
//       },
//       collectibles: { transactionHistory: collectiblesHistory = {} },
//       smartWallet: {
//         upgrade: {
//           status: upgradeStatus,
//           transfer: {
//             transactions: transferTransactions = [],
//           },
//         },
//       },
//     } = getState();
//     if (upgradeStatus !== SMART_WALLET_UPGRADE_STATUSES.TRANSFERRING_ASSETS) return;
//     if (!transferTransactions.length) {
//       // TODO: no transactions at all?
//       return;
//     }
//
//     // update with statuses from history
//     // TODO: visit current workaround to get history from all wallets
//     const accountIds = Object.keys(transactionsHistory);
//     const allHistory = accountIds.reduce(
//       // $FlowFixMe
//       (existing = [], accountId) => {
//         const walletCollectiblesHistory = collectiblesHistory[accountId] || [];
//         const walletAssetsHistory = transactionsHistory[accountId] || [];
//         return [...existing, ...walletAssetsHistory, ...walletCollectiblesHistory];
//       },
//       [],
//     );
//
//     let updatedTransactions = transferTransactions.map(transaction => {
//       const { transactionHash } = transaction;
//       if (!transactionHash || transaction.status === TX_CONFIRMED_STATUS) {
//         return transaction;
//       }
//
//       const minedTx = allHistory.find(_transaction => _transaction.hash === transactionHash);
//       if (!minedTx) return transaction;
//
//       return { ...transaction, status: minedTx.status };
//     });
//
//     // if any is still pending then don't do anything
//     const pendingTransactions = updatedTransactions.filter(transaction => transaction.status === TX_PENDING_STATUS);
//     if (pendingTransactions.length) return;
//
//     const _unsentTransactions = updatedTransactions
//      .filter(transaction => transaction.status !== TX_CONFIRMED_STATUS);
//     if (!_unsentTransactions.length) {
//       const accounts = get(getState(), 'smartWallet.accounts');
//       // account should be already created by this step
//       await dispatch(setSmartWalletUpgradeStatusAction(
//         SMART_WALLET_UPGRADE_STATUSES.DEPLOYING,
//       ));
//       const { address } = accounts[0];
//       navigate(NavigationActions.navigate({ routeName: ASSETS }));
//       await dispatch(connectSmartWalletAccountAction(address));
//       await dispatch(fetchAssetsBalancesAction(assets));
//       dispatch(fetchCollectiblesAction());
//       await dispatch(deploySmartWalletAction());
//     } else {
//       const unsentTransactions = _unsentTransactions.sort(
//         (_a, _b) => _a.signedTransaction.nonce - _b.signedTransaction.nonce,
//       );
//       // grab first in queue
//       const unsentTransaction = unsentTransactions[0];
//       const transactionHash = await dispatch(sendSignedAssetTransactionAction(unsentTransaction));
//       if (!transactionHash) {
//         Toast.show({
//           message: 'Failed to send signed asset',
//           type: 'warning',
//           title: 'Unable to upgrade',
//           autoClose: false,
//         });
//         return;
//       }
//       console.log('sent new asset transfer transaction: ', transactionHash);
//       const { signedTransaction: { signedHash } } = unsentTransaction;
//       const assetTransferTransaction = {
//         ...unsentTransaction,
//         transactionHash,
//       };
//       updatedTransactions = updatedTransactions
//       .filter(
//         transaction => transaction.signedTransaction.signedHash !== signedHash,
//       )
//       .concat({
//         ...assetTransferTransaction,
//         status: TX_PENDING_STATUS,
//       });
//       waitForTransaction(transactionHash)
//       .then(async () => {
//         const _updatedTransactions = updatedTransactions
//         .filter(
//           _transaction => _transaction.transactionHash !== transactionHash,
//         ).concat({
//           ...assetTransferTransaction,
//           status: TX_CONFIRMED_STATUS,
//         });
//         await dispatch(setAssetsTransferTransactionsAction(_updatedTransactions));
//         dispatch(checkAssetTransferTransactionsAction());
//       })
//       .catch(() => null);
//     }
//     dispatch(setAssetsTransferTransactionsAction(updatedTransactions));
//   };
// };
//
// export const upgradeToSmartWalletAction = (wallet: Object, transferTransactions: Object[]) => {
//   return async (dispatch: Function, getState: Function) => {
//     const { smartWallet: { sdkInitialized } } = getState();
//     if (!sdkInitialized) {
//       Toast.show({
//         message: 'Failed to load Smart Wallet SDK',
//         type: 'warning',
//         title: 'Unable to upgrade',
//         autoClose: false,
//       });
//       return Promise.reject();
//     }
//     await dispatch(loadSmartWalletAccountsAction(wallet.privateKey));
//
//     const { smartWallet: { accounts } } = getState();
//     if (!accounts.length) {
//       Toast.show({
//         message: 'Failed to load Smart Wallet account',
//         type: 'warning',
//         title: 'Unable to upgrade',
//         autoClose: false,
//       });
//       return Promise.reject();
//     }
//
//     const { address } = accounts[0];
//     const addressedTransferTransactions = transferTransactions.map(transaction => {
//       return { ...transaction, to: address };
//     });
//     await dispatch(createAssetsTransferTransactionsAction(
//       wallet,
//       addressedTransferTransactions,
//     ));
//     dispatch(checkAssetTransferTransactionsAction());
//     return Promise.resolve(true);
//   };
// };
