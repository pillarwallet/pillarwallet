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
import { Keyboard, TextInput as RNTextInput } from 'react-native';
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import { useTranslation } from 'translations/translate';

// Components
import AssetSelectorModal from 'components/Modals/AssetSelectorModal';
import TokenValueInput from 'components/inputs/TokenValueInput';
import TokenFiatValueAccessory from 'components/inputs/TokenValueInput/TokenFiatValueAccessory';

// Selectors
import { useWalletAssetBalance } from 'selectors/balances';

// Utils
import { isNativeAsset } from 'utils/assets';
import { truncateDecimalPlaces } from 'utils/bigNumber';

// Types
import type { ViewStyleProp } from 'utils/types/react-native';
import type { AssetOption } from 'models/Asset';

type Props = {|
  assets: AssetOption[],
  selectedAsset: ?AssetOption,
  onSelectAsset: (asset: AssetOption) => mixed,
  value: ?BigNumber,
  onValueChange: (value: ?BigNumber) => mixed,
  editable?: boolean,
  valueInputRef?: React.Ref<typeof RNTextInput>,
  style?: ViewStyleProp,
  title?: string,
|};

const FromAssetSelector = ({
  assets,
  selectedAsset,
  onSelectAsset,
  value,
  onValueChange,
  editable,
  valueInputRef,
  style,
  title,
}: Props) => {
  const { t } = useTranslation();
  const [visibleModal, setVisibleModal] = React.useState(false);

  const balance = useWalletAssetBalance(selectedAsset?.chain, selectedAsset?.address);

  const handleSelectToken = (token: AssetOption) => {
    onValueChange(null);
    onSelectAsset(token);
  };

  const openSelectAsset = () => {
    setVisibleModal(true);
  };

  const handleTokenValueChange = (newTokenValue: ?BigNumber) => {
    onValueChange(newTokenValue);
  };

  const handleUseMax = () => {
    Keyboard.dismiss();
    // eslint-disable-next-line no-nested-ternary
    const maxDecimals = balance.decimalPlaces() === 6 ? 4 : 15;
    onValueChange(truncateDecimalPlaces(balance, maxDecimals));
  };

  const disableUseMax = !editable || isNativeAsset(selectedAsset?.chain, selectedAsset?.address);

  return (
    <Container style={style}>
      <TokenValueInput
        value={value}
        onValueChange={handleTokenValueChange}
        chain={selectedAsset?.chain}
        asset={selectedAsset}
        maxValue={balance}
        editable={editable}
        referenceValue={balance}
        referenceDisableMax={disableUseMax}
        onTokenPress={openSelectAsset}
        ref={valueInputRef}
      />

      <TokenFiatValueAccessory
        value={value}
        chain={selectedAsset?.chain}
        asset={selectedAsset}
        balance={balance}
        onUseMax={handleUseMax}
        useMaxTitle={t('button.spendMax')}
        disableUseMax={disableUseMax}
      />
      <AssetSelectorModal
        visible={visibleModal}
        onCloseModal={setVisibleModal}
        title={title}
        tokens={assets}
        onSelectToken={handleSelectToken}
      />
    </Container>
  );
};

export default FromAssetSelector;

const Container = styled.View``;
