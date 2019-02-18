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
import { saveDbAction } from './dbActions';

export const fetchCollectiblesAction = () => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const { wallet: { data: wallet } } = getState();

    const collectibles = [];
    const collectiblesHistory = [];
    const transactionEvents = await api.fetchCollectiblesTransactionHistory(wallet.address);

    if (!transactionEvents.success) return;

    transactionEvents.asset_events.forEach((event) => {
      const {
        asset,
        transaction,
        to_account: toAcc,
        from_account: fromAcc,
      } = event;
      const {
        asset_contract: assetContract,
        name,
        token_id: tokenId,
        description,
      } = asset;
      const { name: assetContractName, address: contractAddress } = assetContract;
      const { transaction_hash: trxHash, block_number: blockNumber, timestamp } = transaction;

      const collectibleName = name || `${assetContractName} ${tokenId}`;

      const assetData = {
        id: tokenId,
        category: assetContractName,
        name,
        description,
        icon: (/\.(png)$/i).test(asset.image_preview_url) ? asset.image_preview_url : '',
        contractAddress,
        assetContract: assetContractName,
        tokenType: COLLECTIBLES,
      };

      if (asset.owner.address.toUpperCase() === wallet.address.toUpperCase()) { collectibles.push(assetData); }

      const transactionEvent = {
        to: toAcc.address,
        from: fromAcc.address,
        hash: trxHash,
        createdAt: (new Date(timestamp).getTime()) / 1000,
        _id: transaction.id,
        protocol: 'Ethereum',
        // pillarId: null
        asset: collectibleName,
        contractAddress,
        value: 1,
        blockNumber,
        status: 'confirmed',
        // gasUsed: 0,
        type: COLLECTIBLE_TRANSACTION,
        icon: asset.image_preview_url,
        assetData,
      };

      collectiblesHistory.push(transactionEvent);
    });

    dispatch(saveDbAction('collectibles', { collectibles }, true));
    dispatch({ type: UPDATE_COLLECTIBLES, payload: collectibles });
    dispatch(saveDbAction('collectiblesHistory', { collectiblesHistory }, true));
    dispatch({ type: SET_COLLECTIBLES_TRANSACTION_HISTORY, payload: collectiblesHistory });
  };
};
