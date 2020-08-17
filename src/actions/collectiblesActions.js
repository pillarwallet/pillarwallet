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

import { getEnv } from 'configs/envConfig';
import { COLLECTIBLES } from 'constants/assetsConstants';
import {
  UPDATE_COLLECTIBLES,
  SET_COLLECTIBLES_TRANSACTION_HISTORY,
  COLLECTIBLE_TRANSACTION,
  UPDATING_COLLECTIBLE_TRANSACTION,
} from 'constants/collectiblesConstants';
import {
  getAccountAddress,
  getAccountId,
  getActiveAccountAddress,
  getActiveAccountId,
} from 'utils/accounts';
import { getTrxInfo } from 'utils/history';

import type SDKWrapper from 'services/api';
import type { Collectible } from 'models/Collectible';
import type { GetState, Dispatch } from 'reducers/rootReducer';
import type { Account } from 'models/Account';

import { saveDbAction } from './dbActions';

const parseCollectibleMedia = (data) => {
  const {
    image_url: fullImage = '',
    image_preview_url: previewImage = '',
  } = data;

  return {
    icon: previewImage || fullImage,
    image: fullImage || previewImage,
  };
};

export const collectibleFromResponse = (responseItem: Object): Collectible => {
  const {
    token_id: id,
    asset_contract: assetContract,
    name,
    description,
  } = responseItem;

  const { name: category, address: contractAddress } = assetContract;
  const collectibleName = name || `${category} ${id}`;

  const { image, icon } = parseCollectibleMedia(responseItem);

  return {
    id,
    category,
    name: collectibleName,
    description,
    contractAddress,
    assetContract: category,
    tokenType: COLLECTIBLES,
    image,
    icon,
  };
};

const collectibleTransactionUpdate = (hash: string) => {
  return {
    type: UPDATING_COLLECTIBLE_TRANSACTION,
    payload: hash,
  };
};


export const fetchCollectiblesAction = (accountToFetchFor?: Account) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      accounts: { data: accounts },
      collectibles: { data: collectibles },
    } = getState();
    const walletAddress = accountToFetchFor ? getAccountAddress(accountToFetchFor) : getActiveAccountAddress(accounts);
    const accountId = accountToFetchFor ? getAccountId(accountToFetchFor) : getActiveAccountId(accounts);

    if (!walletAddress || !accountId) return;
    const response = await api.fetchCollectibles(walletAddress);

    if (response.error || !response.assets) return;

    const accountCollectibles = response.assets.map(collectibleFromResponse);

    const updatedCollectibles = {
      ...collectibles,
      [accountId]: accountCollectibles,
    };

    dispatch(saveDbAction('collectibles', { collectibles: updatedCollectibles }, true));
    dispatch({ type: UPDATE_COLLECTIBLES, payload: updatedCollectibles });
  };
};

const collectibleTransaction = (event) => {
  const {
    asset,
    transaction,
    to_account: toAcc,
    from_account: fromAcc,
  } = event;

  const {
    asset_contract: assetContract,
    name,
    token_id: id,
    description,
  } = asset;
  const { name: category, address: contractAddress } = assetContract;
  const { transaction_hash: trxHash, block_number: blockNumber, timestamp } = transaction;

  const collectibleName = name || `${category} ${id}`;

  const { image, icon } = parseCollectibleMedia(asset);

  const assetData = {
    id,
    category,
    name: collectibleName,
    description,
    image,
    icon,
    contractAddress,
    assetContract: category,
    tokenType: COLLECTIBLES,
  };

  return {
    to: toAcc.address,
    from: fromAcc.address,
    hash: trxHash,
    createdAt: (new Date(timestamp).getTime()) / 1000,
    _id: transaction.id,
    protocol: 'Ethereum',
    asset: collectibleName,
    contractAddress,
    value: 1,
    blockNumber,
    status: 'confirmed',
    type: COLLECTIBLE_TRANSACTION,
    icon,
    assetData,
  };
};

const isCollectibleTransaction = (event: Object): boolean => {
  const { asset } = event;
  // NOTE: for some rare transactions we don't have information about the asset sent
  if (!asset) return false;

  const { asset_contract: assetContract } = asset;
  if (!assetContract) return false;

  return assetContract.schema_name === 'ERC721';
};

export const fetchCollectiblesHistoryAction = (accountToFetchFor?: Account) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      accounts: { data: accounts },
      collectibles: { transactionHistory: collectiblesHistory },
    } = getState();

    const walletAddress = accountToFetchFor ? getAccountAddress(accountToFetchFor) : getActiveAccountAddress(accounts);
    const accountId = accountToFetchFor ? getAccountId(accountToFetchFor) : getActiveAccountId(accounts);

    if (!walletAddress || !accountId) return;
    const response = await api.fetchCollectiblesTransactionHistory(walletAddress);

    if (response.error || !response.asset_events) return;

    const accountCollectiblesHistory = response.asset_events
      .filter(isCollectibleTransaction)
      .map(collectibleTransaction);

    const updatedCollectiblesHistory = {
      ...collectiblesHistory,
      [accountId]: accountCollectiblesHistory,
    };

    dispatch(saveDbAction('collectiblesHistory', { collectiblesHistory: updatedCollectiblesHistory }, true));
    dispatch({ type: SET_COLLECTIBLES_TRANSACTION_HISTORY, payload: updatedCollectiblesHistory });
  };
};


export const fetchAllAccountsCollectiblesAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
    } = getState();

    const promises = accounts.map(async account => {
      await dispatch(fetchCollectiblesAction(account));
    });
    await Promise.all(promises).catch(_ => _);
  };
};


export const fetchAllAccountsCollectiblesHistoryAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      accounts: { data: accounts },
    } = getState();

    const promises = accounts.map(async account => {
      await dispatch(fetchCollectiblesHistoryAction(account));
    });
    await Promise.all(promises).catch(_ => _);
  };
};


export const fetchAllCollectiblesDataAction = () => {
  return async (dispatch: Dispatch) => {
    await dispatch(fetchCollectiblesAction());
    await dispatch(fetchCollectiblesHistoryAction());
  };
};

export const updateCollectibleTransactionAction = (hash: string) => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      session: { data: { isOnline } },
      collectibles: { transactionHistory: collectiblesHistory },
    } = getState();
    if (!isOnline) return;

    dispatch(collectibleTransactionUpdate(hash));
    const trxInfo = await getTrxInfo(api, hash, getEnv('COLLECTIBLES_NETWORK'));
    if (!trxInfo) {
      dispatch(collectibleTransactionUpdate(''));
      return;
    }
    const {
      txInfo,
      txReceipt,
      status,
    } = trxInfo;

    const accounts = Object.keys(collectiblesHistory);
    const updatedHistory = accounts.reduce((history, accountId) => {
      const accountHistory = collectiblesHistory[accountId].map(transaction => {
        if (transaction.hash.toLowerCase() !== hash) {
          return transaction;
        }
        return {
          ...transaction,
          status,
          gasPrice: txInfo.gasPrice ? txInfo.gasPrice.toNumber() : transaction.gasPrice,
          gasUsed: txReceipt.gasUsed ? txReceipt.gasUsed.toNumber() : transaction.gasUsed,
        };
      });
      return { ...history, [accountId]: accountHistory };
    }, {});

    dispatch(saveDbAction('collectiblesHistory', { collectiblesHistory: updatedHistory }, true));
    dispatch({ type: SET_COLLECTIBLES_TRANSACTION_HISTORY, payload: updatedHistory });
  };
};
