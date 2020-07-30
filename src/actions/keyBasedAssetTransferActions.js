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

// components
import Toast from 'components/Toast';

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
import { fetchGasInfoAction } from 'actions/historyActions';

// utils
import { addressesEqual, getAssetsAsList, transformBalancesToObject } from 'utils/assets';
import { getGasPriceWei, reportLog } from 'utils/common';
import { findFirstSmartAccount, getAccountAddress } from 'utils/accounts';

// services
import { calculateGasEstimate, fetchTransactionInfo, transferSigned } from 'services/assets';
import CryptoWallet from 'services/cryptoWallet';

// types
import type SDKWrapper from 'services/api';
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { AssetData, KeyBasedAssetTransfer } from 'models/Asset';
import type { Account } from 'models/Account';


const buildAssetTransferTransaction = (asset: AssetData, transactionExtra: Object) => {
  if (asset?.tokenType === COLLECTIBLES) {
    const { id: tokenId, contractAddress } = asset;
    return { tokenId, contractAddress, ...transactionExtra };
  }
  const {
    token: symbol,
    contractAddress,
    decimals,
  } = asset;
  return {
    symbol,
    contractAddress,
    decimals,
    ...transactionExtra,
  };
};

const signKeyBasedAssetTransferTransaction = async (
  keyBasedWalletAddress: string,
  smartWalletAddress: string,
  keyBasedAssetTransfer: KeyBasedAssetTransfer,
  walletProvider: Object,
  keyBasedAccount: Account,
  dispatch: Dispatch,
  getState: GetState,
) => {
  // get only signed transaction
  const {
    calculatedGasLimit: gasLimit,
    gasPrice,
    assetData,
    amount,
  } = keyBasedAssetTransfer;
  const transaction = buildAssetTransferTransaction(assetData, {
    from: keyBasedWalletAddress,
    to: smartWalletAddress,
    gasPrice,
    gasLimit,
    amount,
    signOnly: true,
  });

  let signedTransaction;
  if (keyBasedAssetTransfer?.assetData?.tokenType === COLLECTIBLES) {
    // $FlowFixMe note: added per current implementation
    signedTransaction = await walletProvider.transferERC721(
      keyBasedAccount,
      transaction,
      getState(),
    );
  } else if (keyBasedAssetTransfer?.assetData?.token === ETH) {
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

  if (!signedTransaction || signedTransaction.error) throw new Error(signedTransaction.error);

  // update local transaction count
  const { nonce: lastNonce, transactionCount: lastCount } = signedTransaction;
  const txCountNew = { lastCount, lastNonce };
  dispatch({ type: UPDATE_TX_COUNT, payload: txCountNew });
  dispatch(saveDbAction('txCount', { txCount: txCountNew }, true));

  return signedTransaction;
};

export const removeKeyBasedAssetToTransferAction = (assetData: AssetData) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { keyBasedAssetTransfer: { data: keyBasedAssetsToTransfer } } = getState();

    // filter out matching
    const updatedKeyBasedAssetsToTransfer = keyBasedAssetsToTransfer.filter(({ assetData: transferAssetData }) => {
      if (transferAssetData?.tokenType !== COLLECTIBLES) return transferAssetData?.token !== assetData.token;
      const isMatchingCollectible = transferAssetData?.id === assetData?.id
        && addressesEqual(transferAssetData?.contractAddress, assetData?.contractAddress);
      return !isMatchingCollectible;
    });

    dispatch({ type: SET_KEY_BASED_ASSETS_TO_TRANSFER, payload: updatedKeyBasedAssetsToTransfer });
  };
};

export const addKeyBasedAssetToTransferAction = (assetData: AssetData, amount?: number) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { keyBasedAssetTransfer: { data: keyBasedAssetsToTransfer } } = getState();
    const updatedKeyBasedAssetsToTransfer = keyBasedAssetsToTransfer.concat({ assetData, amount });
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
    if (fetchedCollectibles.error) {
      reportLog('Failed to fetch key based wallet collectibles', { requestResult: fetchedCollectibles });
    } else {
      availableCollectibles = !isEmpty(fetchedCollectibles?.assets)
        ? fetchedCollectibles.assets.map(collectibleFromResponse)
        : [];
    }

    dispatch({ type: SET_AVAILABLE_KEY_BASED_COLLECTIBLES_TO_TRANSFER, payload: availableCollectibles });
  };
};

export const setAndStoreKeyBasedAssetsToTransferAction = (keyBasedAssetsToTransfer: KeyBasedAssetTransfer[]) => {
  return (dispatch: Dispatch) => {
    dispatch(saveDbAction('keyBasedAssetTransfer', { keyBasedAssetsToTransfer }, true));
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

    const firstSmartAccount = findFirstSmartAccount(accounts);
    if (!firstSmartAccount) {
      reportLog('Failed to find smart wallet account in key based estimate calculations.');
      return;
    }

    if (isCalculatingGas) return;
    dispatch({ type: SET_CALCULATING_KEY_BASED_ASSETS_TO_TRANSFER_GAS, payload: true });

    await dispatch(fetchGasInfoAction());
    const { history: { gasInfo } } = getState();
    const gasPrice = getGasPriceWei(gasInfo);

    const keyBasedAssetsToTransferUpdated = await Promise.all(
      keyBasedAssetsToTransfer.map(async (keyBasedAssetToTransfer) => {
        const { assetData, amount } = keyBasedAssetToTransfer;
        const estimateTransaction = buildAssetTransferTransaction(assetData, {
          amount,
          from: keyBasedWalletAddress,
          to: getAccountAddress(firstSmartAccount),
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
    if (!hasPending) {
      if (!isEmpty(transferTransactionsInQueue)) {
        // submit first in queue
        const assetToTransferTransaction = transferTransactionsInQueue[0].signedTransaction;
        const transactionSent = await transferSigned(assetToTransferTransaction?.signedHash)
          .catch((error) => ({ error }));
        if (!transactionSent?.hash || transactionSent.error) {
          reportLog('Failed to send key based asset migration signed transaction', {
            signedTransaction: assetToTransferTransaction,
            error: transactionSent.error,
          });
        } else {
          // update with pending status
          const updatedTransaction: KeyBasedAssetTransfer = {
            ...transferTransactionsInQueue[0],
            status: TX_PENDING_STATUS,
            transactionHash: transactionSent.hash,
          };
          const updatedTransactionSignedHash = updatedTransaction?.signedTransaction?.signedHash;
          keyBasedAssetsToTransferUpdated = keyBasedAssetsToTransferUpdated
            .filter(({ signedTransaction }) => signedTransaction?.signedHash !== updatedTransactionSignedHash)
            .concat(updatedTransaction);
        }
      } else if (!isEmpty(keyBasedAssetsToTransferUpdated)) {
        // transfer done, reset
        keyBasedAssetsToTransferUpdated = [];
        Toast.show({
          message: 'Your key based wallet assets have been transferred successfully!',
          type: 'success',
          title: 'Success',
        });
      }
    }

    dispatch(setAndStoreKeyBasedAssetsToTransferAction(keyBasedAssetsToTransferUpdated));
  };
};

export const createKeyBasedAssetsToTransferTransactionsAction = (wallet: Wallet) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      wallet: { data: { address: keyBasedWalletAddress } },
      accounts: { data: accounts },
      keyBasedAssetTransfer: { data: keyBasedAssetsToTransfer },
    } = getState();

    const firstSmartAccount = findFirstSmartAccount(accounts);
    if (!firstSmartAccount) {
      reportLog('Failed to find smart wallet account in key based asset transfer creation.');
      return;
    }

    // only temporary mock, used for type checking and retrieving addresses in calls below
    const keyBasedAccount: Account = {
      id: keyBasedWalletAddress,
      type: ACCOUNT_TYPES.KEY_BASED,
      isActive: false,
      walletId: '',
    };

    const cryptoWallet = new CryptoWallet(wallet.privateKey, keyBasedAccount);
    const walletProvider = await cryptoWallet.getProvider();

    // sync local nonce
    const transactionCount = await walletProvider.getTransactionCount(keyBasedWalletAddress);
    dispatch({
      type: UPDATE_TX_COUNT,
      payload: {
        lastCount: transactionCount,
        lastNonce: transactionCount - 1,
      },
    });

    /**
     * we need this to be sequential and wait for each to complete because of local nonce increment
     * side note: eslint ignored because of "async for" not allowed, however, we need it for sequential calls
     */
    const keyBasedAssetsToTransferUpdated = [];
    for (const keyBasedAssetTransfer of keyBasedAssetsToTransfer) { // eslint-disable-line
      const signedTransaction = await signKeyBasedAssetTransferTransaction( // eslint-disable-line
        keyBasedWalletAddress,
        getAccountAddress(firstSmartAccount),
        keyBasedAssetTransfer,
        walletProvider,
        keyBasedAccount,
        dispatch,
        getState,
      ).catch((error) => {
        reportLog('Failed to create key based asset migration signed transaction', { keyBasedAssetTransfer, error });
        return null;
      });
      if (signedTransaction) keyBasedAssetsToTransferUpdated.push({ ...keyBasedAssetTransfer, signedTransaction });
    }

    dispatch(setAndStoreKeyBasedAssetsToTransferAction(keyBasedAssetsToTransferUpdated));
    dispatch(checkKeyBasedAssetTransferTransactionsAction());
  };
};
