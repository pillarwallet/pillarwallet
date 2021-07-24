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
import { mapValues } from 'lodash';

// Constants
import { COLLECTIBLES } from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';
import {
  SET_COLLECTIBLES_TRANSACTION_HISTORY,
  COLLECTIBLE_TRANSACTION,
  SET_UPDATING_COLLECTIBLE_TRANSACTION,
  SET_ACCOUNT_COLLECTIBLES,
} from 'constants/collectiblesConstants';

// Services
import { fetchCollectibles, fetchCollectiblesTransactionHistory } from 'services/opensea';
import { getPoapCollectiblesOnXDai } from 'services/poap';

// Utils
import {
  getAccountAddress,
  getAccountId,
  getActiveAccountAddress,
  getActiveAccountId,
  isEtherspotAccount,
} from 'utils/accounts';
import { getTrxInfo } from 'utils/history';
import { isCaseInsensitiveMatch, reportErrorLog } from 'utils/common';

// Selectors
import { activeAccountSelector } from 'selectors';

// Types
import type { Collectible, CollectibleTransaction } from 'models/Collectible';
import type { GetState, Dispatch } from 'reducers/rootReducer';
import type { Account } from 'models/Account';
import type { OpenSeaAsset, OpenSeaHistoryItem } from 'models/OpenSea';

// Actions
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

export const collectibleFromResponse = (responseItem: OpenSeaAsset): Collectible => {
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
    name: collectibleName,
    description,
    contractAddress,
    tokenType: COLLECTIBLES,
    image,
    icon,
    iconUrl: icon,
    imageUrl: image,
    chain: CHAIN.ETHEREUM,
  };
};

const collectibleTransactionUpdate = (hash: string) => {
  return {
    type: SET_UPDATING_COLLECTIBLE_TRANSACTION,
    payload: hash,
  };
};

export const fetchCollectiblesAction = (defaultAccount?: Account) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const account = defaultAccount ?? activeAccountSelector(getState());
    if (!account) {
      reportErrorLog('fetchCollectiblesAction failed: no account', { defaultAccount });
      return;
    }

    const walletAddress = getAccountAddress(account);
    const accountId = getAccountId(account);

    const openSeaCollectibles = await fetchCollectibles(walletAddress);
    if (!openSeaCollectibles) {
      reportErrorLog('fetchCollectiblesAction failed: fetchCollectibles response not valid', {
        openSeaCollectibles,
        accountId,
        walletAddress,
        account,
      });
    }

    let updatedAccountCollectibles = openSeaCollectibles
      ? { [CHAIN.ETHEREUM]: openSeaCollectibles.map(collectibleFromResponse) }
      : {};

    if (isEtherspotAccount(account)) {
      const poapCollectiblesOnXDai = await getPoapCollectiblesOnXDai(walletAddress);
      updatedAccountCollectibles = { ...updatedAccountCollectibles, [CHAIN.XDAI]: poapCollectiblesOnXDai };
    }

    dispatch({ type: SET_ACCOUNT_COLLECTIBLES, payload: { accountId, collectibles: updatedAccountCollectibles } });

    const updatedCollectibles = getState().collectibles.data;
    dispatch(saveDbAction('collectibles', { collectibles: updatedCollectibles }, true));
  };
};

const collectibleTransaction = (event: OpenSeaHistoryItem): CollectibleTransaction => {
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

  const {
    name: category,
    address: contractAddress,
  } = assetContract;

  const {
    transaction_hash: trxHash,
    block_number: blockNumber,
    timestamp,
  } = transaction;

  const transactionId = (+transaction.id).toString();

  const collectibleName = name || `${category} ${tokenId}`;

  const { image, icon } = parseCollectibleMedia(asset);

  const assetData = {
    id: tokenId,
    name: collectibleName,
    description,
    image,
    icon,
    iconUrl: icon,
    imageUrl: image,
    contractAddress,
    tokenType: COLLECTIBLES,
    chain: CHAIN.ETHEREUM,
  };

  return {
    to: toAcc.address,
    from: fromAcc.address,
    hash: trxHash,
    batchHash: null,
    createdAt: (new Date(timestamp).getTime()) / 1000,
    _id: transactionId,
    protocol: 'Ethereum', // eslint-disable-line i18next/no-literal-string
    assetSymbol: collectibleName,
    assetAddress: contractAddress,
    contractAddress,
    value: 1,
    blockNumber,
    status: 'confirmed', // eslint-disable-line i18next/no-literal-string
    type: COLLECTIBLE_TRANSACTION,
    icon,
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
    const {
      accounts: { data: accounts },
      collectibles: { transactionHistory: collectiblesHistory },
    } = getState();

    const walletAddress = account
      ? getAccountAddress(account)
      : getActiveAccountAddress(accounts);

    const accountId = account
      ? getAccountId(account)
      : getActiveAccountId(accounts);

    if (!walletAddress || !accountId) {
      reportErrorLog('fetchCollectiblesHistoryAction failed: no walletAddress or accountId', {
        accountId,
        walletAddress,
        defaultAccount: account,
      });
      return;
    }

    const openSeaHistory = await fetchCollectiblesTransactionHistory(walletAddress);
    if (!openSeaHistory) {
      reportErrorLog('fetchCollectiblesHistoryAction failed: response not valid', {
        openSeaHistory,
        accountId,
        walletAddress,
        defaultAccount: account,
      });
      return;
    }

    const accountCollectiblesHistory = openSeaHistory
      .filter(isOpenSeaCollectibleTransaction)
      .map(collectibleTransaction);

    // TODO: implement multichain when available
    const updatedCollectiblesHistory = {
      ...collectiblesHistory,
      [accountId]: { ethereum: accountCollectiblesHistory },
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
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      session: { data: { isOnline } },
      collectibles: { transactionHistory: collectiblesHistory },
    } = getState();
    if (!isOnline) return;

    dispatch(collectibleTransactionUpdate(hash));
    const trxInfo = await getTrxInfo(hash, getEnv().COLLECTIBLES_NETWORK);
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
      const accountHistory = mapValues(
        collectiblesHistory[accountId] ?? {},
        (transactions = []) => transactions.map((transaction) => {
          if (!transaction?.hash || !isCaseInsensitiveMatch(transaction?.hash, hash)) {
            return transaction;
          }
          return {
            ...transaction,
            status,
            gasPrice: txInfo.gasPrice ? txInfo.gasPrice.toNumber() : transaction.gasPrice,
            gasUsed: txReceipt.gasUsed ? txReceipt.gasUsed.toNumber() : transaction.gasUsed,
          };
        }),
      );
      return { ...history, [accountId]: accountHistory };
    }, {});

    dispatch(saveDbAction('collectiblesHistory', { collectiblesHistory: updatedHistory }, true));
    dispatch({ type: SET_COLLECTIBLES_TRANSACTION_HISTORY, payload: updatedHistory });
  };
};
