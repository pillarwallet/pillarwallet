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
import isEmpty from 'lodash.isempty';

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
import { TX_CONFIRMED_STATUS, TX_PENDING_STATUS } from 'constants/historyConstants';

// actions
import { getAllOwnedAssets } from 'actions/assetsActions';
import { collectibleFromResponse } from 'actions/collectiblesActions';
import { saveDbAction } from 'actions/dbActions';

// utils
import { getAssetsAsList, transformBalancesToObject } from 'utils/assets';
import { getGasPriceWei, reportLog } from 'utils/common';
import { findFirstSmartAccount, getAccountAddress } from 'utils/accounts';

// services
import { calculateGasEstimate, fetchTransactionInfo, transferSigned } from 'services/assets';
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

  // sync local nonce
  const transactionCount = await walletProvider.getTransactionCount(keyBasedWalletAddress);
  dispatch({
    type: UPDATE_TX_COUNT,
    payload: {
      lastCount: transactionCount,
      lastNonce: transactionCount - 1,
    },
  });

  // get only signed transaction
  const { gasPrice, calculatedGasLimit: gasLimit, asset } = keyBasedAssetTransfer;
  const transaction = buildAssetTransferTransaction(asset, {
    from: keyBasedWalletAddress,
    to: getAccountAddress(findFirstSmartAccount(accounts)),
    gasPrice,
    gasLimit,
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
    // always make sure ETH is last transaction
    dispatch(saveDbAction('keyBasedAssetTransfer', { keyBasedAssetsToTransfer }, true));
    dispatch({ type: SET_KEY_BASED_ASSETS_TO_TRANSFER, payload: keyBasedAssetsToTransfer });
  };
};

export const calculateKeyBasedAssetsToTransferTransactionGasAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      wallet: { data: { address: keyBasedWalletAddress } },
      accounts: { data: accounts },
      keyBasedAssetTransfer: { data: keyBasedAssetsToTransfer, isCalculatingGas },
    } = getState();
    let { history: { gasInfo } } = getState();

    if (isCalculatingGas) return;
    dispatch({ type: SET_CALCULATING_KEY_BASED_ASSETS_TO_TRANSFER_GAS, payload: true });

    if (isEmpty(gasInfo) || !gasInfo?.isFetched) gasInfo = await api.fetchGasInfo();
    const gasPrice = getGasPriceWei(gasInfo);

    const keyBasedAssetsToTransferUpdated = await Promise.all(
      keyBasedAssetsToTransfer.map(async (keyBasedAssetToTransfer) => {
        const { asset } = keyBasedAssetToTransfer;
        const estimateTransaction = buildAssetTransferTransaction(asset, {
          from: keyBasedWalletAddress,
          to: getAccountAddress(findFirstSmartAccount(accounts)),
        });
        const gasLimit = await calculateGasEstimate(estimateTransaction);
        return { ...keyBasedAssetToTransfer, gasPrice, calculatedGasLimit: gasLimit };
      }),
    );

    dispatch({ type: SET_KEY_BASED_ASSETS_TO_TRANSFER, payload: keyBasedAssetsToTransferUpdated });
    dispatch({ type: SET_CALCULATING_KEY_BASED_ASSETS_TO_TRANSFER_GAS, payload: false });
  };
};

export const checkKeyBasedAssetTransferTransactionsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { keyBasedAssetTransfer: { data: keyBasedAssetsToTransfer } } = getState();

    let keyBasedAssetsToTransferUpdated = await Promise.all(
      keyBasedAssetsToTransfer.map(async (keyBasedAssetToTransfer) => {
        const { transactionHash, status } = keyBasedAssetToTransfer;
        if (transactionHash && status !== TX_CONFIRMED_STATUS) {
          const transactionInfo = await fetchTransactionInfo(transactionHash);
          if (!isEmpty(transactionInfo)) {
            return { ...keyBasedAssetToTransfer, status: TX_CONFIRMED_STATUS };
          }
        }
        return keyBasedAssetToTransfer;
      }),
    );

    // submit new in queue if no pending
    const hasPending = keyBasedAssetsToTransferUpdated.some(({ status }) => status === TX_PENDING_STATUS);
    const transferTransactionsInQueue = keyBasedAssetsToTransferUpdated.filter(({ status }) => !status);
    if (!hasPending && !isEmpty(transferTransactionsInQueue)) {
      // submit first in queue
      const assetToTransferTransaction = transferTransactionsInQueue[0].signedTransaction;
      const transactionSent = await transferSigned(assetToTransferTransaction.signedHash).catch((error) => ({ error }));
      if (!transactionSent?.hash || transactionSent.error) {
        reportLog('Failed to send key based asset transger signed transaction', {
          signedTransaction: assetToTransferTransaction,
          error: transactionSent.error,
        });
        return;
      }

      // update with pending status
      const updatedTransaction = {
        ...transferTransactionsInQueue[0],
        status: TX_PENDING_STATUS,
        transactionHash: transactionSent.hash,
      };
      keyBasedAssetsToTransferUpdated = keyBasedAssetsToTransferUpdated
        .filter(({ signedTransaction }) => signedTransaction.signedHash === updatedTransaction.signedHash)
        .concat(updatedTransaction);
    }

    dispatch(setAndStoreKeyBasedAssetsToTransferAction(keyBasedAssetsToTransferUpdated));
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
    dispatch(checkKeyBasedAssetTransferTransactionsAction());
  };
};
