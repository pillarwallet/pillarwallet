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

import { isEmpty } from 'lodash';

// Constants
import { ASSET_TYPES } from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';
import {
  SET_COLLECTIBLES_TRANSACTION_HISTORY,
  COLLECTIBLE_TRANSACTION,
  SET_ACCOUNT_COLLECTIBLES,
} from 'constants/collectiblesConstants';

// Services
import { fetchCollectiblesTransactionHistory } from 'services/opensea';
import { getPoapCollectiblesOnXDai } from 'services/poap';
import etherspotService from 'services/etherspot';

// Utils
import {
  getAccountAddress,
  getAccountId,
  getActiveAccountAddress,
  getActiveAccountId,
  isEtherspotAccount,
} from 'utils/accounts';
import { logBreadcrumb } from 'utils/common';
import { getSupportedChains } from 'utils/chains';

// Selectors
import { activeAccountSelector } from 'selectors';

// Types
import type { Collectible, CollectibleTransaction } from 'models/Collectible';
import type { GetState, Dispatch } from 'reducers/rootReducer';
import type { Account } from 'models/Account';
import type { OpenSeaAsset, OpenSeaHistoryItem } from 'models/OpenSea';
import type { Chain } from 'models/Chain';
import type { NftList } from 'etherspot';

// Actions
import { saveDbAction } from './dbActions';

const parseCollectibleMedia = (data) => {
  const { image_url: fullImage = '', image_preview_url: previewImage = '' } = data;

  return {
    icon: previewImage || fullImage,
    image: fullImage || previewImage,
  };
};

export const parseCollectibleFromOpenSeaAsset = (asset: OpenSeaAsset): Collectible => {
  const contract = asset.asset_contract;
  const { image, icon } = parseCollectibleMedia(asset);

  return {
    id: asset.token_id,
    name: asset.name || `${contract.name} ${asset.token_id}`,
    description: asset.description,
    contractAddress: contract.address,
    tokenType: ASSET_TYPES.COLLECTIBLE,
    image,
    icon,
    iconUrl: icon,
    imageUrl: image,
    chain: CHAIN.ETHEREUM,
    isLegacy: contract.nft_version === '1.0',
  };
};

export const parseCollectibleFromEtherspot = (chain: Chain, asset: NftList): Collectible => {
  return {
    id: asset.items[0]?.tokenId,
    name: asset.items[0]?.name,
    description: asset.description,
    icon: asset.items[0]?.image,
    iconUrl: asset.items[0]?.image,
    image: asset.items[0]?.image,
    imageUrl: asset.items[0]?.image,
    contractAddress: asset.contractAddress,
    tokenType: ASSET_TYPES.COLLECTIBLE,
    chain,
    isLegacy: asset.nftVersion === '1.0',
  };
};

export const fetchCollectiblesAction = (defaultAccount?: Account) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const nftsEnabled = getState().nftFlag?.visible;

    /**
     * Is the NFT flag falsy? Return.
     */
    if (!nftsEnabled) {
      return;
    }

    const account = defaultAccount ?? activeAccountSelector(getState());
    if (!account) {
      logBreadcrumb('fetchCollectiblesAction', 'failed: no account', { defaultAccount });
      return;
    }

    const walletAddress = getAccountAddress(account);
    const accountId = getAccountId(account);

    const chains = getSupportedChains(account);

    let updatedAccountCollectibles: Object = {};
    await Promise.all(
      chains.map(async (chain: Chain) => {
        const accoutnCollectibles = await etherspotService.getNftList(chain, walletAddress);
        if (isEmpty(accoutnCollectibles?.items)) return;
        updatedAccountCollectibles[chain] =
            accoutnCollectibles?.items?.map((asset) => parseCollectibleFromEtherspot(chain, asset)) ?? [];
      }),
    );

    if (!updatedAccountCollectibles) {
      logBreadcrumb('fetchCollectiblesAction', 'failed: fetchCollectibles response not valid', {
        accoutnCollectibles: updatedAccountCollectibles,
        accountId,
        walletAddress,
        account,
      });
    }

    if (isEtherspotAccount(account)) {
      const poapCollectiblesOnXDai = await getPoapCollectiblesOnXDai(walletAddress);
      updatedAccountCollectibles = {
        ...updatedAccountCollectibles,
        [CHAIN.XDAI]: poapCollectiblesOnXDai,
      };
    }

    dispatch({ type: SET_ACCOUNT_COLLECTIBLES, payload: { accountId, collectibles: updatedAccountCollectibles } });

    const updatedCollectibles = getState().collectibles.data;
    dispatch(saveDbAction('collectibles', { collectibles: updatedCollectibles }, true));
  };
};

const parseCollectibleTransactionFromOpenSeaHistoryItem = (event: OpenSeaHistoryItem): CollectibleTransaction => {
  const { asset, transaction, to_account: toAcc, from_account: fromAcc } = event;

  const contract = asset.asset_contract;

  const { transaction_hash: trxHash, block_number: blockNumber, timestamp } = transaction;

  const transactionId = (+transaction.id).toString();

  const assetData = parseCollectibleFromOpenSeaAsset(asset);

  return {
    to: toAcc.address,
    from: fromAcc.address,
    hash: trxHash,
    batchHash: null,
    createdAt: new Date(timestamp).getTime() / 1000,
    _id: transactionId,
    protocol: 'Ethereum', // eslint-disable-line i18next/no-literal-string
    assetSymbol: assetData.name,
    assetAddress: contract.address,
    contractAddress: contract.address,
    value: 1,
    blockNumber,
    status: 'confirmed', // eslint-disable-line i18next/no-literal-string
    type: COLLECTIBLE_TRANSACTION,
    icon: assetData.icon ?? '',
    assetData,
  };
};

const isOpenSeaCollectibleTransaction = (event: Object): boolean => {
  const { asset } = event;
  // NOTE: for some rare transactions we don't have information about the asset sent
  if (!asset) return false;

  const { asset_contract: assetContract } = asset;
  if (!assetContract) return false;

  return assetContract.schema_name === 'ERC721';
};

export const fetchCollectiblesHistoryAction = (account?: Account) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const nftsEnabled = getState().nftFlag.visible;

    if (!nftsEnabled) {
      return;
    }

    const {
      accounts: { data: accounts },
      collectibles: { transactionHistory: collectiblesHistory },
    } = getState();

    const walletAddress = account ? getAccountAddress(account) : getActiveAccountAddress(accounts);

    const accountId = account ? getAccountId(account) : getActiveAccountId(accounts);

    if (!walletAddress || !accountId) {
      logBreadcrumb('fetchCollectiblesHistoryAction', 'failed: no walletAddress or accountId', {
        accountId,
        walletAddress,
        defaultAccount: account,
      });
      return;
    }

    const openSeaHistory = await fetchCollectiblesTransactionHistory();
    if (!openSeaHistory) {
      logBreadcrumb('fetchCollectiblesHistoryAction', 'failed: response not valid', {
        openSeaHistory,
        accountId,
        walletAddress,
        defaultAccount: account,
      });
      return;
    }

    const accountCollectiblesHistory = openSeaHistory
      .filter(isOpenSeaCollectibleTransaction)
      .map(parseCollectibleTransactionFromOpenSeaHistoryItem);

    // TODO: implement multichain when available
    const updatedCollectiblesHistory = {
      ...collectiblesHistory,
      [accountId]: { ethereum: accountCollectiblesHistory },
    };

    dispatch(saveDbAction('collectiblesHistory', { collectiblesHistory: updatedCollectiblesHistory }, true));
    dispatch({ type: SET_COLLECTIBLES_TRANSACTION_HISTORY, payload: updatedCollectiblesHistory });
  };
};

