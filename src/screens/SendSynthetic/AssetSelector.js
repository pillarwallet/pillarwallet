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
import TokenValueInputs from 'components/inputs/TokenFiatValueInputs';

// Utils
import { wrapBigNumberOrNil } from 'utils/bigNumber';
import { valueForAddress } from 'utils/common';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { AssetOption } from 'models/Asset';
import type { WalletAssetsBalances } from 'models/Balances';

type Props = {|
  tokens: AssetOption[],
  balances: WalletAssetsBalances,
  selectedToken: ?AssetOption,
  onSelectToken: (token: AssetOption) => mixed,
  value: ?BigNumber,
  onValueChange: (value: ?BigNumber) => mixed,
  style?: ViewStyleProp,
|};

const AssetSelector = ({
  tokens,
  balances,
  selectedToken,
  onSelectToken,
  value,
  onValueChange,
  style,
}: Props) => {
  const handleSelectToken = (token: AssetOption) => {
    onSelectToken(token);

    if (selectedToken !== token) {
      onValueChange(null);
    }
  };

  const handleSelectAsset = () => {
    Keyboard.dismiss();

    Modal.open(() => (
      <AssetSelectorModal
        tokens={tokens}
        onSelectToken={handleSelectToken}
      />
    ));
  };

  const balance = wrapBigNumberOrNil(valueForAddress(balances, selectedToken?.address)?.balance);

  return (
    <TokenValueInputs
      value={value}
      onValueChange={onValueChange}
      chain={selectedToken?.chain}
      asset={selectedToken}
      balance={balance}
      onTokenPress={handleSelectAsset}
      style={style}
    />
  );
};

export default AssetSelector;
