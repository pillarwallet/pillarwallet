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

// Constants
import { CHAIN } from 'constants/chainConstants';

// Selectors
import { useRootSelector, useFiatCurrency, useChainSupportedAssets, useChainRates } from 'selectors';
import { archanovaAccountIdSelector } from 'selectors/accounts';
import { useCollectiblesForAccount } from 'selectors/collectibles';

// Utils
import { mapNotNil } from 'utils/array';
import { findAssetByAddress } from 'utils/assets';
import { findCollectibleByAddress } from 'utils/collectibles';
import { BigNumber } from 'utils/common';
import { recordValues } from 'utils/object';
import { getAssetValueInFiat } from 'utils/rates';

// Types
import type { Account } from 'models/Account';
import type { Asset } from 'models/Asset';
import type { Collectible } from 'models/Collectible';
import type { TransactionToEstimate } from 'models/Transaction';

export type AssetItem = TokenItem | CollectibleItem;

export type TokenItem = {|
  token: Asset,
  balance: BigNumber,
  balanceInFiat: ?number,
|};

export type CollectibleItem = {|
  collectible: Collectible,
|};

export const useAssetItems = () => {
  const tokenItems = useTokenItems();
  const collectibleItems = useCollectibleItems();
  return [...tokenItems, ...collectibleItems];
};

export const useTokenItems = (): TokenItem[] => {
  const tokensToMigrate = useRootSelector((root) => root.walletMigrationArchanova.tokensToMigrate);
  const supportedAssets = useChainSupportedAssets(CHAIN.ETHEREUM);
  const rates = useChainRates(CHAIN.ETHEREUM);
  const currency = useFiatCurrency();

  const tokenValues = recordValues(tokensToMigrate);
  return mapNotNil(tokenValues, (tokenBalance) => {
    const token = findAssetByAddress(supportedAssets, tokenBalance.address);
    if (!token) return null;

    const balance = BigNumber(tokenBalance.balance);
    const balanceInFiat = getAssetValueInFiat(tokenBalance.balance, tokenBalance.address, rates, currency);
    return { token, balance, balanceInFiat };
  });
};

export const useCollectibleItems = (): CollectibleItem[] => {
  const collectiblesToMigrate = useRootSelector((root) => root.walletMigrationArchanova.collectiblesToMigrate);
  const archanovaAccountId = useRootSelector(archanovaAccountIdSelector);
  const collectibles = useCollectiblesForAccount(archanovaAccountId)?.ethereum;

  const collectibleValues = recordValues(collectiblesToMigrate);
  return mapNotNil(collectibleValues, (collectible) =>
    findCollectibleByAddress(collectibles, collectible.address),
  ).map((collectible) => ({ collectible }));
};

export const mapAssetItemToTransactionToEstimate = (item: AssetItem, toAccount: Account): TransactionToEstimate => {
  if (item.collectible) return mapCollectibleItemToTransactionToEstimate(item, toAccount);
  return mapTokenItemToTransactionToEstimate(item, toAccount);
};

export const mapTokenItemToTransactionToEstimate = (
  tokenItem: TokenItem,
  toAccount: Account,
): TransactionToEstimate => {
  const { token, balance } = tokenItem;

  return {
    to: toAccount?.id,
    value: balance.toString(),
    assetData: {
      contractAddress: token.address,
      token: token.symbol,
      decimals: token.decimals,
    },
  };
};

export const mapCollectibleItemToTransactionToEstimate = (
  collectibleItem: CollectibleItem,
  toAccount: Account,
): TransactionToEstimate => {
  const { collectible } = collectibleItem;

  // $FlowFixMe: used as in SendCollectibleConfirm
  return {
    to: toAccount?.id,
    value: 0,
    // $FlowFixMe: used as in SendCollectibleConfirm
    assetData: collectible,
  };
};
