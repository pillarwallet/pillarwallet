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
import { formatEther } from 'ethers/lib/utils';

// components
import Toast from 'components/Toast';

// constants
import { ASSET_TYPES, ETH } from 'constants/assetsConstants';
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
import { CHAIN } from 'constants/chainConstants';

// actions
import { parseCollectibleFromOpenSeaAsset } from 'actions/collectiblesActions';
import { saveDbAction } from 'actions/dbActions';
import { fetchGasInfoAction } from 'actions/historyActions';

// utils
import { addressesEqual, getBalance, transformBalancesToObject } from 'utils/assets';
import { BigNumber, truncateAmount, logBreadcrumb } from 'utils/common';
import { findFirstEtherspotAccount, getAccountAddress } from 'utils/accounts';
import { calculateETHTransactionAmountAfterFee } from 'utils/transactions';

// services
import { calculateGasEstimate, transferSigned } from 'services/assets';
import KeyBasedWallet from 'services/keyBasedWallet';
import etherspotService from 'services/etherspot';
import { fetchCollectibles } from 'services/opensea';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { AssetData, KeyBasedAssetTransfer } from 'models/Asset';
import type { Account } from 'models/Account';
import { ethereumSupportedAssetsSelector } from 'selectors/assets';

const buildAssetTransferTransaction = (asset: AssetData, transactionExtra: any) => {
  if (asset.tokenType === ASSET_TYPES.COLLECTIBLE) {
    const { contractAddress, id: tokenId } = asset;
    return { contractAddress, tokenId, ...transactionExtra };
  }

  const { token: symbol, contractAddress, decimals } = asset;
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
  if (keyBasedAssetTransfer?.assetData?.tokenType === ASSET_TYPES.COLLECTIBLE) {
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
      if (transferAssetData?.tokenType !== ASSET_TYPES.COLLECTIBLE) return transferAssetData?.token !== assetData.token;
      const isMatchingCollectible = transferAssetData?.id === assetData?.id
        && addressesEqual(transferAssetData?.contractAddress, assetData?.contractAddress);
      return !isMatchingCollectible;
    });

    dispatch({ type: SET_KEY_BASED_ASSETS_TO_TRANSFER, payload: updatedKeyBasedAssetsToTransfer });
  };
};

export const addKeyBasedAssetToTransferAction = (assetData: AssetData, amount?: BigNumber) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { keyBasedAssetTransfer: { data: keyBasedAssetsToTransfer } } = getState();
    const updatedKeyBasedAssetsToTransfer = keyBasedAssetsToTransfer.concat({ assetData, draftAmount: amount });
    dispatch({ type: SET_KEY_BASED_ASSETS_TO_TRANSFER, payload: updatedKeyBasedAssetsToTransfer });
  };
};

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

    const fetchedCollectibles = await fetchCollectibles(keyBasedWalletAddress);
    if (!fetchedCollectibles) {
      logBreadcrumb('fetchAvailableCollectiblesToTransferAction', 'Failed to fetch key based wallet collectibles', {
        requestResult: fetchedCollectibles,
      });
    } else {
      availableCollectibles = fetchedCollectibles.map(parseCollectibleFromOpenSeaAsset);
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
      logBreadcrumb('calculateKeyBasedAssetsToTransferTransactionGasAction', 'failed: no keyBasedWalletAddress');
      return;
    }

    const etherspotAccount = findFirstEtherspotAccount(accounts);
    if (!etherspotAccount) {
      logBreadcrumb(
        'calculateKeyBasedAssetsToTransferTransactionGasAction',
        'Failed to find Etherspot account in key based estimate calculations.',
      );
      return;
    }

    if (isCalculatingGas) return;
    dispatch({ type: SET_CALCULATING_KEY_BASED_ASSETS_TO_TRANSFER_GAS, payload: true });

    await dispatch(fetchGasInfoAction(CHAIN.ETHEREUM));
    const { history: { gasInfo } } = getState();
    const ethereumGasInfo = gasInfo?.[CHAIN.ETHEREUM];
    if (!ethereumGasInfo?.isFetched || !ethereumGasInfo?.gasPrice) {
      logBreadcrumb('calculateKeyBasedAssetsToTransferTransactionGasAction', 'failed: no gas price.');
      return;
    }

    const gasPrice = ethereumGasInfo.gasPrice.instant;

    let keyBasedAssetsToTransferUpdated = await Promise.all(
      keyBasedAssetsToTransfer.map(async (keyBasedAssetToTransfer) => {
        const { assetData, draftAmount } = keyBasedAssetToTransfer;
        const amount = draftAmount ? truncateAmount(draftAmount, assetData.decimals) : undefined;
        const estimateTransaction = buildAssetTransferTransaction(assetData, {
          amount,
          from: keyBasedWalletAddress,
          to: getAccountAddress(etherspotAccount),
        });
        const gasLimit = await calculateGasEstimate(estimateTransaction);
        return {
          ...keyBasedAssetToTransfer,
          calculatedGasLimit: gasLimit,
          amount,
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
      const ethTransferAmountBN = new BigNumber(ethTransfer.draftAmount?.toFixed() ?? 0);
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
        const adjustedEthTransferAmount = truncateAmount(adjustedEthTransferAmountBN, 18);
        const estimateTransaction = buildAssetTransferTransaction(ethTransfer.assetData, {
          amount: adjustedEthTransferAmount,
          from: keyBasedWalletAddress,
          to: getAccountAddress(etherspotAccount),
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

export const createKeyBasedAssetsToTransferTransactionsAction = (wallet: Wallet) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      wallet: { data: walletData },
      accounts: { data: accounts },
      keyBasedAssetTransfer: { data: keyBasedAssetsToTransfer, creatingTransactions },
    } = getState();

    const keyBasedWalletAddress = walletData?.address;
    if (!keyBasedWalletAddress) {
      logBreadcrumb('createKeyBasedAssetsToTransferTransactionsAction', 'failed: no keyBasedWalletAddress');
      return;
    }

    if (creatingTransactions) return;
    dispatch({ type: SET_CREATING_KEY_BASED_ASSET_TRANSFER_TRANSACTIONS, payload: true });

    const etherspotAccount = findFirstEtherspotAccount(accounts);
    if (!etherspotAccount) {
      logBreadcrumb(
        'createKeyBasedAssetsToTransferTransactionsAction',
        'Failed to find Etherspot account in key based asset transfer creation.',
      );
      return;
    }

    // only temporary mock, used for type checking and retrieving addresses in calls below
    const keyBasedAccount: Account = {
      id: keyBasedWalletAddress,
      type: ACCOUNT_TYPES.KEY_BASED,
      isActive: false,
    };

    const keyBasedWallet = new KeyBasedWallet(wallet.privateKey);

    // sync local nonce
    const transactionCount = await keyBasedWallet.getTransactionCount(keyBasedWalletAddress);
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
        getAccountAddress(etherspotAccount),
        keyBasedAssetTransfer,
        keyBasedWallet,
        keyBasedAccount,
        dispatch,
        getState,
      ).catch((error) => {
        logBreadcrumb('createKeyBasedAssetsToTransferTransactionsAction',
          'Failed to create key based asset migration signed transaction',
          { keyBasedAssetTransfer, error });
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
    const assetHasPositiveBalance = (assetAddress) => !!getBalance(availableBalances, assetAddress);

    const hasPositiveBalance = !isEmpty(availableCollectibles) || (
      !isEmpty(availableBalances) && Object.keys(availableBalances).some(assetHasPositiveBalance)
    );

    dispatch({ type: SET_KEY_BASED_WALLET_HAS_POSITIVE_BALANCE, payload: hasPositiveBalance });
  };
};
