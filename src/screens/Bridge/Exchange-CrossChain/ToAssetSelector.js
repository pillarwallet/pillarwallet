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
import styled from 'styled-components/native';

// Components
import AssetSelectorModal from 'components/Modals/AssetSelectorModal';
import TokenValueInput from 'components/inputs/TokenValueInput';
import TokenFiatValueAccessory from 'components/inputs/TokenValueInput/TokenFiatValueAccessory';

// Selectors
import { useWalletAssetBalance } from 'selectors/balances';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { AssetOption } from 'models/Asset';
import type { Chain } from 'models/Chain';

type Props = {|
  assets: AssetOption[],
  selectedAsset: ?AssetOption,
  onSelectAsset: (asset: AssetOption) => mixed,
  value: ?BigNumber,
  style?: ViewStyleProp,
  title?: string,
  chain?: Chain | null,
  isFetching: boolean,
  searchTokenList?: any,
|};

const ToAssetSelector = ({
  searchTokenList,
  assets,
  selectedAsset,
  onSelectAsset,
  value,
  style,
  title,
  chain,
  isFetching,
}: Props) => {
  const balance = useWalletAssetBalance(selectedAsset?.chain, selectedAsset?.address);
  const [visibleModal, setVisibleModal] = React.useState(false);

  const openSelectAsset = () => {
    setVisibleModal(true);
  };

  return (
    <Container style={style}>
      <TokenValueInput
        value={value}
        chain={selectedAsset?.chain}
        asset={selectedAsset}
        editable={false}
        referenceDisableMax
        onTokenPress={openSelectAsset}
        toFixedValue={4}
      />

      <TokenFiatValueAccessory
        value={value}
        balance={balance}
        chain={selectedAsset?.chain}
        asset={selectedAsset}
        isFetching={isFetching}
        isToSelector
        disableUseMax
      />
      <AssetSelectorModal
        visible={visibleModal}
        onCloseModal={setVisibleModal}
        chain={chain}
        title={title}
        tokens={assets}
        searchTokenList={searchTokenList}
        onSelectToken={onSelectAsset}
      />
    </Container>
  );
};

export default ToAssetSelector;

const Container = styled.View``;
