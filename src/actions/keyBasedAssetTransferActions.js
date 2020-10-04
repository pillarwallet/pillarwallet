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
import t from 'translations/translate';
import { BigNumber } from 'bignumber.js';
import { formatEther } from 'ethers/lib/utils';

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
  SET_KEY_BASED_WALLET_HAS_POSITIVE_BALANCE,
  SET_CREATING_KEY_BASED_ASSET_TRANSFER_TRANSACTIONS,
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
import { addressesEqual, getAssetsAsList, getBalance, transformBalancesToObject } from 'utils/assets';
import { formatFullAmount, getGasPriceWei, reportLog } from 'utils/common';
import { findFirstSmartAccount, getAccountAddress } from 'utils/accounts';
import { calculateETHTransactionAmountAfterFee } from 'utils/transactions';

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
    const updatedKeyBasedAssetsToTransfer = keyBasedAssetsToTransfer.concat({ assetData, draftAmount: amount });
    dispatch({ type: SET_KEY_BASED_ASSETS_TO_TRANSFER, payload: updatedKeyBasedAssetsToTransfer });
  };
};

export const fetchAvailableBalancesToTransferAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      wallet: { data: walletData },
      assets: { supportedAssets },
    } = getState();

    const keyBasedWalletAddress = walletData?.address;
    if (!keyBasedWalletAddress) {
      reportLog('fetchAvailableBalancesToTransferAction failed: no keyBasedWalletAddress');
      return;
    }

    dispatch({ type: SET_FETCHING_AVAILABLE_KEY_BASED_BALANCES_TO_TRANSFER });

    // fetch key based assets
    const ownedAssets = await getAllOwnedAssets(api, keyBasedWalletAddress, supportedAssets);

    // it's not fetched on mainnet using getAllOwnedAssets
    if (!ownedAssets[ETH]) {
      ownedAssets[ETH] = supportedAssets.find(({ symbol }) => symbol === ETH);
    }

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
    const keyBasedWalletAddress = getState().wallet.data?.address;
    if (!keyBasedWalletAddress) {
      reportLog('fetchAvailableCollectiblesToTransferAction failed: no keyBasedWalletAddress');
      return;
    }

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
    dispatch({ type: SET_KEY_BASED_ASSETS_TO_TRANSFER, payload: keyBasedAssetsToTransfer });
    dispatch(saveDbAction('keyBasedAssetTransfer', { keyBasedAssetsToTransfer }, true));
  };
};

export const calculateKeyBasedAssetsToTransferTransactionGasAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      wallet: { data: walletData },
      accounts: { data: accounts },
      keyBasedAssetTransfer: { data: keyBasedAssetsToTransfer, isCalculatingGas, availableBalances },
    } = getState();

    const keyBasedWalletAddress = walletData?.address;
    if (!keyBasedWalletAddress) {
      reportLog('calculateKeyBasedAssetsToTransferTransactionGasAction failed: no keyBasedWalletAddress');
      return;
    }

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

    let keyBasedAssetsToTransferUpdated = await Promise.all(
      keyBasedAssetsToTransfer.map(async (keyBasedAssetToTransfer) => {
        const { assetData, draftAmount } = keyBasedAssetToTransfer;
        const estimateTransaction = buildAssetTransferTransaction(assetData, {
          amount: draftAmount,
          from: keyBasedWalletAddress,
          to: getAccountAddress(firstSmartAccount),
        });
        const gasLimit = await calculateGasEstimate(estimateTransaction);
        return {
          ...keyBasedAssetToTransfer,
          calculatedGasLimit: gasLimit,
          amount: draftAmount,
          gasPrice,
        };
      }),
    );

    /**
     * ETH transfer amount adjustment below covers case if ETH is being transferred and sum of ETH amount
     * that is being sent plus calculated ETH fees for token transfer is more than ETH balance that is left
     * after ETH and token transfer, i.e. all ETH balance is sent and 0 left which is nt enough for other transfers
     *
     * in these case we want to subtract all transfer fees in ETH from ETH amount that is being sent that
     * sum of ETH balance that is left after transfer plus ETH that is being transferred is lower than ETH fees
     * needed to cover all transfer transactions
     */

    // check if ETH is being transferred and adjust transfer amount if needed
    const ethTransfer = keyBasedAssetsToTransferUpdated.find(({ assetData }) => assetData?.token === ETH);
    if (ethTransfer) {
      const ethTransferAmountBN = new BigNumber(ethTransfer.draftAmount);
      const totalTransferFeeWeiBN: BigNumber = keyBasedAssetsToTransferUpdated.reduce(
        (a: BigNumber, b: any) => a.plus(new BigNumber(b.gasPrice.toString()).multipliedBy(b.calculatedGasLimit)),
        new BigNumber(0),
      );
      const totalTransferFeeEthBN = new BigNumber(formatEther(totalTransferFeeWeiBN.toFixed()));
      const adjustedEthTransferAmountBN = calculateETHTransactionAmountAfterFee(
        ethTransferAmountBN,
        availableBalances,
        totalTransferFeeEthBN,
      );

      // check if adjusted amount is enough to cover fees, otherwise it's not enough ETH in general
      if (adjustedEthTransferAmountBN.isPositive()) {
        const adjustedEthTransferAmount = formatFullAmount(adjustedEthTransferAmountBN.toString());
        const estimateTransaction = buildAssetTransferTransaction(ethTransfer.assetData, {
          amount: adjustedEthTransferAmount,
          from: keyBasedWalletAddress,
          to: getAccountAddress(firstSmartAccount),
        });
        const gasLimit = await calculateGasEstimate(estimateTransaction);
        const adjustedEthTransfer = {
          ...ethTransfer,
          amount: adjustedEthTransferAmount,
          calculatedGasLimit: gasLimit,
          gasPrice,
        };
        keyBasedAssetsToTransferUpdated = keyBasedAssetsToTransferUpdated
          .filter(({ assetData }) => assetData.token !== ETH)
          .concat(adjustedEthTransfer);
      }
    }

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
        if (!transactionSent?.hash || transactionSent?.error) {
          reportLog('Failed to send key based asset migration signed transaction', {
            assetToTransferTransaction: transferTransactionsInQueue[0],
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
          message: t('toast.keyWalletAssetsTransfered'),
          emoji: 'ok_hand',
        });
      }
    }

    dispatch(setAndStoreKeyBasedAssetsToTransferAction(keyBasedAssetsToTransferUpdated));
  };
};

export const createKeyBasedAssetsToTransferTransactionsAction = (wallet: Wallet) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      wallet: { data: walletData },
      accounts: { data: accounts },
      keyBasedAssetTransfer: { data: keyBasedAssetsToTransfer, creatingTransactions },
    } = getState();

    const keyBasedWalletAddress = walletData?.address;
    if (!keyBasedWalletAddress) {
      reportLog('createKeyBasedAssetsToTransferTransactionsAction failed: no keyBasedWalletAddress');
      return;
    }

    if (creatingTransactions) return;
    dispatch({ type: SET_CREATING_KEY_BASED_ASSET_TRANSFER_TRANSACTIONS, payload: true });

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
    dispatch({ type: SET_CREATING_KEY_BASED_ASSET_TRANSFER_TRANSACTIONS, payload: false });

    // check and send first transaction
    dispatch(checkKeyBasedAssetTransferTransactionsAction());
  };
};

export const checkIfKeyBasedWalletHasPositiveBalanceAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    await dispatch(fetchAvailableCollectiblesToTransferAction());
    await dispatch(fetchAvailableBalancesToTransferAction());

    const { keyBasedAssetTransfer: { availableBalances, availableCollectibles } } = getState();
    const assetHasPositiveBalance = (symbol) => !!getBalance(availableBalances, symbol);

    const hasPositiveBalance = !isEmpty(availableCollectibles) || (
      !isEmpty(availableBalances) && Object.keys(availableBalances).some(assetHasPositiveBalance)
    );

    dispatch({ type: SET_KEY_BASED_WALLET_HAS_POSITIVE_BALANCE, payload: hasPositiveBalance });
  };
};
