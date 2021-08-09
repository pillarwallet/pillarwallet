// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
import { providers } from 'ethers';

// services
import { getContract } from 'services/assets';
import { callSubgraph } from 'services/theGraph';
import { firebaseRemoteConfig } from 'services/firebase';

// utils
import httpRequest from 'utils/httpRequest';
import { reportErrorLog } from 'utils/common';

// abis
import ERC721_CONTRACT_ABI from 'abi/erc721.json';

// constants
import { CHAIN } from 'constants/chainConstants';
import { ASSET_TYPES } from 'constants/assetsConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// types
import type { Collectible } from 'models/Collectible';


/* eslint-disable i18next/no-literal-string */
const poapContractAddress = '0x22c1f6050e56d2876009903609a2cc3fef83b415';
const poapSubgraphName = 'poap-xyz/poap-xdai';
/* eslint-enable i18next/no-literal-string */

export const getPoapCollectiblesOnXDai = async (walletAddress: string): Promise<Collectible[]> => {
  const xDaiRpcUrl = firebaseRemoteConfig.getString(REMOTE_CONFIG.XDAI_RPC_ENDPOINT);
  const xDaiRpcProvider = new providers.JsonRpcProvider(xDaiRpcUrl);

  const collectibleContract = getContract(
    poapContractAddress,
    ERC721_CONTRACT_ABI,
    xDaiRpcProvider,
  );

  if (!collectibleContract) return [];

  /* eslint-disable i18next/no-literal-string */
  const result = await callSubgraph(poapSubgraphName, `
    {
      tokens(first: 5, where: {
        owner: "${walletAddress.toLowerCase()}"
      }) {
        id
      }
    }
  `);
  /* eslint-enable i18next/no-literal-string */

  const tokenIds = (result?.tokens ?? []).map(({ id }) => id);

  const tokensWithMetadata = await Promise.all(tokenIds.map(async (tokenId) => {
    const tokenMetadataUri = await collectibleContract.tokenURI(tokenId).catch(() => null);
    if (!tokenMetadataUri) return null;

    try {
      const { data } = await httpRequest.get(tokenMetadataUri);
      return { ...data, tokenId };
    } catch (error) {
      reportErrorLog('getPoapCollectiblesOnXDai token URI fetch failed', {
        error,
        tokenId,
        tokenMetadataUri,
        walletAddress,
      });
    }

    return null;
  }));

  return tokensWithMetadata.filter(Boolean).map(({
    name,
    description,
    image_url: imageUrl,
    tokenId,
  }) => ({
    id: tokenId,
    name,
    description,
    icon: imageUrl,
    iconUrl: imageUrl,
    image: imageUrl,
    imageUrl,
    contractAddress: poapContractAddress,
    tokenType: ASSET_TYPES.COLLECTIBLE,
    chain: CHAIN.XDAI,
  }));
};

