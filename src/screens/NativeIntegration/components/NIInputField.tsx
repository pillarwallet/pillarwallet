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
import { useTranslation } from 'translations/translate';
import { Platform, StyleSheet, TextInput as RNTextInput } from 'react-native';
import styled from 'styled-components/native';

// Components
import Text from 'components/core/Text';
import BigNumberInput from 'components/inputs/BigNumberInput';
import Switcher from 'components/Switcher';
import Input from 'components/inputs/TextInput';
import MultilineTextInput from 'components/inputs/MultilineTextInput';
import { Spacing } from 'components/legacy/Layout';
import AssetSelector from 'components/SendAsset/AssetSelector';

// Services
import { fontStyles } from 'utils/variables';

// Selectors
import { useRootSelector, activeAccountAddressSelector } from 'selectors/selectors';
import { accountAssetsWithBalanceSelector } from 'selectors/assets';

// Utils
import { useThemeColors } from 'utils/themes';
import { useNameValid, isValidAddress } from 'utils/validators';
import { addressesEqual } from 'utils/assets';

// Types
import type { AssetOption } from 'models/Asset';
import type { Collectible } from 'models/Collectible';

// Constants
import { ASSET_TYPES } from 'constants/assetsConstants';

type Props = {
  itemInfo: infoType;
  valueInputRef?: React.Ref<typeof RNTextInput>;
  value: any;
  onChangeValue: (val: any) => void;
  txFeeInfo?: any;
  chain?: string;
  disableAssetSelectorModal?: boolean;
};

type infoType = {
  internalType: string;
  name: string | null | '';
  type: string;
};

function NIInputField({ itemInfo, chain, value, onChangeValue, txFeeInfo, disableAssetSelectorModal = false }: Props) {
  const { t } = useTranslation();
  const inputRef = React.useRef();
  const colors = useThemeColors();
  const activeAccountAddress = useRootSelector(activeAccountAddressSelector);
  const assetsWithBalance = useRootSelector(accountAssetsWithBalanceSelector);

  let defaultAssetData = assetsWithBalance.find(
    (response) => response?.chain === chain && response?.address === '0x0000000000000000000000000000000000000000',
  );

  const defaultAssetOption = defaultAssetData && {
    ...defaultAssetData,
    symbol: defaultAssetData.token,
  };

  const [assetData, setAssetData] = React.useState<AssetOption | Collectible>(
    defaultAssetData?.tokenType ? defaultAssetData : defaultAssetOption || [],
  );
  const selectedToken: AssetOption = assetData?.tokenType !== ASSET_TYPES.COLLECTIBLE ? assetData : null;
  const selectedCollectible: Collectible = assetData?.tokenType === ASSET_TYPES.COLLECTIBLE ? assetData : null;

  const handleSelectToken = (token: AssetOption) => {
    if (token) setAssetData(token);
  };

  const handleSelectCollectible = (collectible: Collectible) => {
    if (collectible) setAssetData?.(collectible);
  };

  const { data } = useNameValid(value);

  const getValidationError = () => {
    if (value?.c || typeof value == 'boolean') return null;
    if (addressesEqual(value, activeAccountAddress)) {
      return t('error.cannotSendToYourself');
    }
    if (value && !isValidAddress(value) && !data?.[0]) {
      return t('error.incorrectAddress');
    }
    return null;
  };

  const onChangeAddress = (val) => {
    const input = val.trimLeft().replace(/\s\s/g, ' ');
    onChangeValue(input);
  };

  const errorMessage = getValidationError();
  const inputStyles = [styles.input, { color: !!errorMessage ? colors.negative : colors.text }];

  const inputComponent = () => {
    if (itemInfo?.type === 'nativeTokenInput') {
      return (
        <AssetSelector
          selectedToken={selectedToken}
          onSelectToken={handleSelectToken}
          selectedCollectible={selectedCollectible}
          onSelectCollectible={handleSelectCollectible}
          value={value}
          onValueChange={onChangeValue}
          txFeeInfo={txFeeInfo}
          disableAssetSelectorModal={disableAssetSelectorModal}
          hideFiatValueInput
        />
      );
    }

    if (itemInfo?.type?.includes('uint')) {
      return (
        <BigNumberInput
          value={value}
          returnType="done"
          onValueChange={onChangeValue}
          editable={true}
          decimals={18}
          placeholder={itemInfo.type}
          style={styles.input}
        />
      );
    }

    if (itemInfo?.type === 'address') {
      return (
        <MultilineTextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeAddress}
          style={inputStyles}
          autoCapitalize="none"
          autoCompleteType="off"
          autoCorrect={false}
          placeholder={itemInfo.type}
          blurOnSubmit
        />
      );
    }

    if (itemInfo?.type === 'bool') {
      return <Switcher isOn={value} onToggle={onChangeValue} />;
    }

    return (
      <Input
        ref={inputRef}
        style={styles.input}
        numberOfLines={1}
        value={value}
        onChangeText={onChangeValue}
        placeholder={itemInfo.type}
      />
    );
  };

  return (
    <Container>
      <Content isRow={itemInfo.type === 'bool' ? true : false}>
        <Title>{itemInfo.name}</Title>
        {inputComponent()}
        <Spacing h={20} />
      </Content>
    </Container>
  );
}

export default NIInputField;

const styles = StyleSheet.create({
  input: {
    fontSize: 24,
    marginVertical: Platform.OS === 'ios' ? 5 : 0,
  },
});

const Container = styled.View``;

const Content = styled.View`
  flex-direction: ${({ isRow }) => (isRow ? 'row' : 'column')};
  justify-content: space-between;
`;

const Title = styled(Text)`
  ${fontStyles.medium};
  font-variant: tabular-nums;
`;
