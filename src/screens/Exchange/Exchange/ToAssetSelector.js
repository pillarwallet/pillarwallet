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
import styled from 'styled-components/native';

// Components
import AssetSelectorModal from 'components/AssetSelectorModal';
import Modal from 'components/Modal';
import TokenValueInput from 'components/Inputs/TokenValueInput';
import TokenFiatValueAccessory from 'components/Inputs/TokenFiatValueAccessory';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { AssetOption } from 'models/Asset';


type Props = {|
  assets: AssetOption[],
  selectedAsset: ?AssetOption,
  onSelectAsset: (asset: AssetOption) => mixed,
  value: ?BigNumber,
  style?: ViewStyleProp,
|};

const ToAssetSelector = ({ assets, selectedAsset, onSelectAsset, value, style }: Props) => {
  const openSelectAsset = () => {
    Keyboard.dismiss();
    Modal.open(() => <AssetSelectorModal options={assets} onSelectOption={onSelectAsset} />);
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
      />

      <TokenFiatValueAccessory
        value={value}
        chain={selectedAsset?.chain}
        asset={selectedAsset}
        disableUseMax
      />
    </Container>
  );
};

export default ToAssetSelector;

const Container = styled.View``;
