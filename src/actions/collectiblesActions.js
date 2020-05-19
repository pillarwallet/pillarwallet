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
import { COLLECTIBLES } from 'constants/assetsConstants';
import {
  UPDATE_COLLECTIBLES,
  SET_COLLECTIBLES_TRANSACTION_HISTORY,
  COLLECTIBLE_TRANSACTION,
} from 'constants/collectiblesConstants';
import { getActiveAccountAddress, getActiveAccountId } from 'utils/accounts';
import type SDKWrapper from 'services/api';
import type { Collectible } from 'models/Collectible';
import type { GetState, Dispatch } from 'reducers/rootReducer';
import { saveDbAction } from './dbActions';
import { getExistingTxNotesAction } from './txNoteActions';

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

const collectibleFromResponse = (responseItem: Object): Collectible => {
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

export const fetchCollectiblesAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      accounts: { data: accounts },
      collectibles: { data: collectibles },
    } = getState();
    const walletAddress = getActiveAccountAddress(accounts);
    const accountId = getActiveAccountId(accounts);
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

export const fetchCollectiblesHistoryAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      accounts: { data: accounts },
      collectibles: { transactionHistory: collectiblesHistory },
    } = getState();
    const walletAddress = getActiveAccountAddress(accounts);
    const accountId = getActiveAccountId(accounts);
    const response = await api.fetchCollectiblesTransactionHistory(walletAddress);

    if (response.error || !response.asset_events) return;

    const accountCollectiblesHistory = response.asset_events
      .filter(isCollectibleTransaction)
      .map(collectibleTransaction);

    const updatedCollectiblesHistory = {
      ...collectiblesHistory,
      [accountId]: accountCollectiblesHistory,
    };

    dispatch(getExistingTxNotesAction());
    dispatch(saveDbAction('collectiblesHistory', { collectiblesHistory: updatedCollectiblesHistory }, true));
    dispatch({ type: SET_COLLECTIBLES_TRANSACTION_HISTORY, payload: updatedCollectiblesHistory });
  };
};

export const fetchAllCollectiblesDataAction = () => {
  return async (dispatch: Dispatch) => {
    await dispatch(fetchCollectiblesAction());
    await dispatch(fetchCollectiblesHistoryAction());
  };
};
