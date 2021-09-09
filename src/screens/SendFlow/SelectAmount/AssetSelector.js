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

import * as React from 'react';
import { Keyboard } from 'react-native';
import { BigNumber } from 'bignumber.js';

// Components
import AssetSelectorModal from 'components/Modals/AssetSelectorModal';
import Modal from 'components/Modal';
import TokenFiatValueInputs from 'components/inputs/TokenFiatValueInputs';
import CollectibleInput from 'components/inputs/CollectibleInput';

// Selectors
import { useRootSelector } from 'selectors';
import { accountAssetsWithBalanceSelector } from 'selectors/assets';
import { useWalletAssetBalance } from 'selectors/balances';
import { accountCollectiblesSelector } from 'selectors/collectibles';

// Utils
import { addressesEqual, isNativeAsset } from 'utils/assets';
import { fromBaseUnit } from 'utils/bigNumber';
import { getGasAddress } from 'utils/transactions';

// Types
import type { AssetOption } from 'models/Asset';
import type { ChainRecord } from 'models/Chain';
import type { Collectible } from 'models/Collectible';
import type { TransactionFeeInfo } from 'models/Transaction';

type Props = {|
  selectedToken: ?AssetOption,
  onSelectToken: (token: ?AssetOption) => mixed,
  value: ?BigNumber,
  onValueChange: (value: ?BigNumber) => mixed,
  selectedCollectible?: ?Collectible,
  onSelectCollectible?: (collectible: ?Collectible) => mixed,
  txFeeInfo: ?TransactionFeeInfo,
|};

const AssetSelector = ({
  selectedToken,
  onSelectToken,
  value,
  onValueChange,
  selectedCollectible,
  onSelectCollectible,
  txFeeInfo,
}: Props) => {
  const inputRef = React.useRef();

  const tokens = useRootSelector(accountAssetsWithBalanceSelector);
  const collectibles = flattenCollectibles(useRootSelector(accountCollectiblesSelector));

  const tokenBalance = useWalletAssetBalance(selectedToken?.chain, selectedToken?.address);
  const tokenBalanceAfterFee = useTokenBalanceAfterFee(selectedToken, txFeeInfo);

  React.useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Focus on token input after user changes asset
  React.useEffect(() => {
    let isCancelled = false;

    setTimeout(() => {
      if (!isCancelled) inputRef.current?.focus();
    }, 650);

    return () => {
      isCancelled = true;
    };
  }, [selectedToken]);

  const handleSelectToken = (token: AssetOption) => {
    onSelectCollectible?.(null);
    onValueChange(null);
    onSelectToken(token);
  };

  const handleSelectCollectible = (collectible: Collectible) => {
    onValueChange(null);
    onSelectToken(null);
    onSelectCollectible?.(collectible);
  };

  const handleSelectAsset = () => {
    Keyboard.dismiss();

    Modal.open(() => (
      <AssetSelectorModal
        tokens={tokens}
        onSelectToken={handleSelectToken}
        collectibles={collectibles}
        onSelectCollectible={handleSelectCollectible}
      />
    ));
  };

  if (selectedCollectible) {
    return <CollectibleInput collectible={selectedCollectible} onRequestSelect={handleSelectAsset} />;
  }

  // Disable send max for native assets, as it's hard to get it right atm.
  const disableMaxValue = isNativeAsset(selectedToken?.chain, selectedToken?.address);

  return (
    <TokenFiatValueInputs
      tokenInputRef={inputRef}
      value={value}
      onValueChange={onValueChange}
      chain={selectedToken?.chain}
      asset={selectedToken}
      balance={tokenBalance}
      balanceAfterFee={tokenBalanceAfterFee}
      disableMaxValue={disableMaxValue}
      onTokenPress={handleSelectAsset}
      showChainIcon
    />
  );
};

export default AssetSelector;

function flattenCollectibles(collectiblesPerChain: ChainRecord<Collectible[]>): Collectible[] {
  return Object.keys(collectiblesPerChain).flatMap((chain) => collectiblesPerChain[chain] ?? []);
}

function useTokenBalanceAfterFee(asset: ?AssetOption, feeInfo: ?TransactionFeeInfo) {
  const tokenBalance = useWalletAssetBalance(asset?.chain, asset?.address);

  if (!asset || !tokenBalance) return null;

  if (!feeInfo) return tokenBalance;

  const gasAddress = getGasAddress(asset.chain, feeInfo.gasToken);
  if (!addressesEqual(asset.address, gasAddress)) return tokenBalance;

  const fee = fromBaseUnit(feeInfo.fee ?? 0, asset.decimals);
  return tokenBalance?.minus(fee);
}
