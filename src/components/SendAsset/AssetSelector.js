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
import { BigNumber } from 'bignumber.js';
import { useTranslation } from 'translations/translate';

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
  hideFiatValueInput?: boolean,
  disableAssetSelectorModal?: boolean,
|};

const getToken = (tokens, selectedToken) => {
  return tokens.find((e) => {
    if (selectedToken?.chain === e.chain && selectedToken?.contractAddress === e.contractAddress) {
      return true;
    }
    return false;
  });
};

const AssetSelector = ({
  selectedToken,
  onSelectToken,
  value,
  onValueChange,
  selectedCollectible,
  onSelectCollectible,
  txFeeInfo,
  hideFiatValueInput,
  disableAssetSelectorModal = false,
}: Props) => {
  const { t } = useTranslation();
  const inputRef = React.useRef();
  const [selectToken, setSelectToken] = React.useState(null);

  const tokens = useRootSelector(accountAssetsWithBalanceSelector);
  const collectibles = flattenCollectibles(useRootSelector(accountCollectiblesSelector));

  if (!!selectedToken && !tokens.includes(selectedToken)) {
    selectedToken = getToken(tokens, selectedToken);
  }

  const tokenBalance = useWalletAssetBalance(selectedToken?.chain, selectedToken?.contractAddress);
  const tokenBalanceAfterFee = useTokenBalanceAfterFee(selectedToken, txFeeInfo);

  const handleSelectToken = (token: AssetOption) => {
    onSelectCollectible?.(null);
    onValueChange(null);
    onSelectToken(token);
    setSelectToken(token);
  };

  const handleSelectCollectible = (collectible: Collectible) => {
    onValueChange(null);
    onSelectToken(null);
    onSelectCollectible?.(collectible);
  };

  React.useEffect(() => {
    inputRef.current?.focus();
  }, [selectToken]);

  const handleSelectAsset = () => {
    !disableAssetSelectorModal &&
      Modal.open(() => (
        <AssetSelectorModal
          tokens={tokens}
          title={t('assetSelector.choose_token_send')}
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
  const disableMaxValue = selectedToken ? isNativeAsset(selectedToken?.chain, selectedToken?.contractAddress) : true;

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
      hideFiatValueInput={hideFiatValueInput}
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
