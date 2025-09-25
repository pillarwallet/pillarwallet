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
import isEmpty from 'lodash.isempty';
import t from 'translations/translate';

// components
import Toast from 'components/Toast';

// constants
import {
  SET_FETCHING_AVAILABLE_KEY_BASED_BALANCES_TO_TRANSFER,
  SET_FETCHING_AVAILABLE_KEY_BASED_COLLECTIBLES_TO_TRANSFER,
  SET_KEY_BASED_ASSETS_TO_TRANSFER,
  SET_AVAILABLE_KEY_BASED_BALANCES_TO_TRANSFER,
  SET_AVAILABLE_KEY_BASED_COLLECTIBLES_TO_TRANSFER,
  SET_KEY_BASED_WALLET_HAS_POSITIVE_BALANCE,
} from 'constants/keyBasedAssetTransferConstants';
import { TX_CONFIRMED_STATUS, TX_PENDING_STATUS } from 'constants/historyConstants';
import { CHAIN } from 'constants/chainConstants';

// actions
import { parseCollectibleFromOpenSeaAsset } from 'actions/collectiblesActions';
import { saveDbAction } from 'actions/dbActions';

// utils
import { getBalance, transformBalancesToObject } from 'utils/assets';
import { logBreadcrumb } from 'utils/common';

// services
import { transferSigned } from 'services/assets';
import etherspotService from 'services/etherspot';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { KeyBasedAssetTransfer } from 'models/Asset';
import { ethereumSupportedAssetsSelector } from 'selectors/assets';

export const fetchAvailableBalancesToTransferAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { wallet: { data: walletData } } = getState();

    const keyBasedWalletAddress = walletData?.address;
    if (!keyBasedWalletAddress) {
      logBreadcrumb('fetchAvailableBalancesToTransferAction', 'failed: no keyBasedWalletAddress');
      return;
    }

    dispatch({ type: SET_FETCHING_AVAILABLE_KEY_BASED_BALANCES_TO_TRANSFER });

    const supportedAssets = ethereumSupportedAssetsSelector(getState());

    const availableBalances = await etherspotService.getBalances(
      CHAIN.ETHEREUM,
      keyBasedWalletAddress,
      supportedAssets,
    );

    dispatch({
      type: SET_AVAILABLE_KEY_BASED_BALANCES_TO_TRANSFER,
      payload: transformBalancesToObject(availableBalances),
    });
  };
};

export const fetchAvailableCollectiblesToTransferAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const nftsEnabled = getState().nftFlag.visible;

    /**
     * Is the NFT flag falsy? Return.
     */
    if (!nftsEnabled) { return; }

    const keyBasedWalletAddress = getState().wallet.data?.address;
    if (!keyBasedWalletAddress) {
      logBreadcrumb('fetchAvailableCollectiblesToTransferAction', 'failed: no keyBasedWalletAddress');
      return;
    }

    dispatch({ type: SET_FETCHING_AVAILABLE_KEY_BASED_COLLECTIBLES_TO_TRANSFER });

    let availableCollectibles = [];

    const fetchedCollectibles = await etherspotService.getNftList(CHAIN.ETHEREUM, keyBasedWalletAddress);
    if (!fetchedCollectibles) {
      logBreadcrumb('fetchAvailableCollectiblesToTransferAction', 'Failed to fetch key based wallet collectibles', {
        requestResult: fetchedCollectibles,
      });
    } else {
      availableCollectibles = fetchedCollectibles?.items?.map(parseCollectibleFromOpenSeaAsset);
    }

    dispatch({ type: SET_AVAILABLE_KEY_BASED_COLLECTIBLES_TO_TRANSFER, payload: availableCollectibles });
  };
};

export const setAndStoreKeyBasedAssetsToTransferAction = (keyBasedAssetsToTransfer: KeyBasedAssetTransfer[]) => {
  return (dispatch: Dispatch) => {
    dispatch({ type: SET_KEY_BASED_ASSETS_TO_TRANSFER, payload: keyBasedAssetsToTransfer });
    dispatch(saveDbAction('keyBasedAssetTransfer', { keyBasedAssetsToTransfer }, true));
  };
};


export const checkKeyBasedAssetTransferTransactionsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const { keyBasedAssetTransfer: { data: keyBasedAssetsToTransfer } } = getState();

    let keyBasedAssetsToTransferUpdated = await Promise.all(
      keyBasedAssetsToTransfer.map(async (keyBasedAssetToTransfer) => {
        const { transactionHash, status } = keyBasedAssetToTransfer;
        if (transactionHash && status !== TX_CONFIRMED_STATUS) {
          const transactionInfo = await etherspotService.getTransaction(CHAIN.ETHEREUM, transactionHash);
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
        if (!transactionSent?.hash || transactionSent?.error) {
          logBreadcrumb(
            'checkKeyBasedAssetTransferTransactionsAction',
            'Failed to send key based asset migration signed transaction',
            {
              assetToTransferTransaction: transferTransactionsInQueue[0],
              error: transactionSent.error,
            },
          );
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
          message: t('toast.keyWalletAssetsTransfered'),
          emoji: 'ok_hand',
        });
      }
    }

    dispatch(setAndStoreKeyBasedAssetsToTransferAction(keyBasedAssetsToTransferUpdated));
  };
};

export const checkIfKeyBasedWalletHasPositiveBalanceAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    await dispatch(fetchAvailableCollectiblesToTransferAction());
    await dispatch(fetchAvailableBalancesToTransferAction());

    const { keyBasedAssetTransfer: { availableBalances, availableCollectibles } } = getState();
    const assetHasPositiveBalance = (assetAddress) => !!getBalance(availableBalances, assetAddress);

    const hasPositiveBalance = !isEmpty(availableCollectibles) || (
      !isEmpty(availableBalances) && Object.keys(availableBalances).some(assetHasPositiveBalance)
    );

    dispatch({ type: SET_KEY_BASED_WALLET_HAS_POSITIVE_BALANCE, payload: hasPositiveBalance });
  };
};
