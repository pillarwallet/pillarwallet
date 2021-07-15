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

import { useMemo } from 'react';

// Constants
import { ETH, ADDRESS_ZERO } from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';

// Selectors
import { useRootSelector, useFiatCurrency, useChainSupportedAssets, useChainRates } from 'selectors';
import { etherspotAccountSelector, archanovaAccountIdSelector } from 'selectors/accounts';
import { assetsBalancesPerAccountSelector } from 'selectors/balances';
import { useCollectiblesForAccount } from 'selectors/collectibles';

// Utils
import { mapNotNil } from 'utils/array';
import { findAssetByAddress } from 'utils/assets';
import { buildWalletAssetBalanceInfoList } from 'utils/balances';
import { findCollectibleByAddress } from 'utils/collectibles';
import { BigNumber, humanizeHexString } from 'utils/common';
import { formatTokenValue, formatFiatValue } from 'utils/format';
import { useThemedImages } from 'utils/images';
import { recordValues } from 'utils/object';
import { getAssetValueInFiat } from 'utils/rates';
import { spacing } from 'utils/variables';

// Types
import type { Asset } from 'models/Asset';
import type { WalletAssetBalanceInfo } from 'models/Balances';
import type { Collectible } from 'models/Collectible';
import type { TokenToMigrate, CollectibleToMigrate } from 'models/WalletMigrationArchanova';

export type AssetItem = TokenItem | CollectibleItem;

export type TokenItem = {|
  token: Asset,
  balance: BigNumber,
  balanceInFiat: ?number,
|};

export type CollectibleItem = {|
  collectible: Collectible,
|};

export const useTokenItems = (tokensToMigrate: TokenToMigrate[]): TokenItem[] => {
  const supportedAssets = useChainSupportedAssets(CHAIN.ETHEREUM);
  const rates = useChainRates(CHAIN.ETHEREUM);
  const currency = useFiatCurrency();

  return useMemo(() => {
    return mapNotNil(tokensToMigrate, (tokenBalance) => {
      const token = findAssetByAddress(supportedAssets, tokenBalance.address);
      if (!token) return null;

      const balance = BigNumber(tokenBalance.balance);
      const balanceInFiat = getAssetValueInFiat(tokenBalance.balance, tokenBalance.address, rates, currency);
      return { token, balance, balanceInFiat };
    });
  }, [tokensToMigrate, supportedAssets, rates, currency]);
};

export const useCollectibleItems = (collectiblesToMigrate: CollectibleToMigrate[]): CollectibleItem[] => {
  const archanovaAccountId = useRootSelector(archanovaAccountIdSelector);
  const collectibles = useCollectiblesForAccount(archanovaAccountId)?.ethereum ?? [];

  return useMemo(() => {
    return mapNotNil(collectiblesToMigrate, (collectible) =>
      findCollectibleByAddress(collectibles, collectible.address)?.map((collectible) => ({ collectible })),
    );
  }, []);
};
