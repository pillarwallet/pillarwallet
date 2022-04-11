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
import { StyleSheet, TextInput as RNTextInput } from 'react-native';
import styled from 'styled-components/native';

// Components
import BigNumberInput from 'components/inputs/BigNumberInput';
import Text from 'components/core/Text';
import TokenValueInput from 'components/inputs/TokenValueInput';
import Modal from 'components/Modal';
import AssetSelectorModal from 'components/Modals/AssetSelectorModal';

// Services
import { appFont, fontStyles } from 'utils/variables';

// Selectors
import { useRootSelector } from 'selectors/selectors';
import { accountAssetsWithBalanceSelector } from 'selectors/assets';
import { accountCollectiblesSelector } from 'selectors/collectibles';

// Types
import type { AssetOption } from 'models/Asset';
import type { Collectible } from 'models/Collectible';
import type { ChainRecord } from 'models/Chain';

// Constant
import { ASSET_TYPES } from 'constants/assetsConstants';

type Props = {
  blueprint: bluePrintType | null;
  itemInfo: infoType;
  valueInputRef?: React.Ref<typeof RNTextInput>;
  navigation: any;
};

type inputType =
  | 'BigNumberInput'
  | 'TokenValueInput'
  | 'AutoScaleTextInput'
  | 'CollectibleInput'
  | 'FiatValueInput'
  | 'MultilineTextInput'
  | 'TextInput'
  | 'TokenFiatValueInputs'
  | null;

type bluePrintType = {
  isApprovalNeeded: boolean;
  mapsToParameterNumber: number;
  uiComponent: inputType;
  required: boolean;
  userVisible: boolean;
  uiComponentProperties?: any;
};

type infoType = {
  internalType: string;
  name: string | null | '';
  type: string;
};

function NIInputField({ blueprint, itemInfo, valueInputRef }: Props) {
  const { t } = useTranslation();
  const assetsWithBalance = useRootSelector(accountAssetsWithBalanceSelector);
  const collectibles = flattenCollectibles(useRootSelector(accountCollectiblesSelector));
  const componentNm = blueprint?.uiComponent;

  const [value, setValue] = React.useState();

  let defaultAssetData = getAssetData(assetsWithBalance, undefined);
  const defaultAssetOption = defaultAssetData &&
    defaultAssetData?.token && {
      ...defaultAssetData,
      symbol: defaultAssetData.token,
    };

  const [assetData, setAssetData] = React.useState<AssetOption | Collectible>(
    defaultAssetData?.tokenType ? defaultAssetData : defaultAssetOption || assetsWithBalance[0],
  );
  const selectedToken = assetData?.tokenType !== ASSET_TYPES.COLLECTIBLE ? assetData : null;

  const handleSelectToken = (token: AssetOption) => {
    setAssetData(token);
  };

  const handleSelectCollectible = (collectible: Collectible) => {
    setAssetData(collectible);
  };

  const handleSelectAsset = () => {
    Modal.open(() => (
      <AssetSelectorModal
        tokens={assetsWithBalance}
        onSelectToken={handleSelectToken}
        collectibles={collectibles}
        onSelectCollectible={handleSelectCollectible}
        autoFocus
      />
    ));
  };

  const inputComponent = () => {
    if (componentNm === 'TokenValueInput') {
      return (
        <TokenValueInput
          value={value}
          onValueChange={setValue}
          placeholder={itemInfo.type}
          ref={valueInputRef}
          asset={selectedToken}
          onTokenPress={handleSelectAsset}
          balance={assetData?.balance?.balance}
          style={[styles.input]}
        />
      );
    }

    if (componentNm === 'BigNumberInput') {
      return (
        <BigNumberInput
          value={value}
          returnType="done"
          onValueChange={setValue}
          editable={true}
          placeholder={itemInfo.type}
          style={[styles.input]}
          // onBlur={() => Alert.alert('Index')}
        />
      );
    }

    return null;
  };

  if (componentNm === null) return null;

  return (
    <Container>
      <Title>{itemInfo.name}</Title>
      {inputComponent()}
      <Description>{blueprint?.uiComponentProperties?.description}</Description>
    </Container>
  );
}

export default NIInputField;

const getAssetData = (tokens, selectedToken) => {
  return tokens.find((token) => {
    if (selectedToken?.chain === token.chain && selectedToken?.contractAddress === token.contractAddress) {
      return true;
    }
    return false;
  });
};

function flattenCollectibles(collectiblesPerChain: ChainRecord<Collectible[]>): Collectible[] {
  return Object.keys(collectiblesPerChain).flatMap((chain) => collectiblesPerChain[chain] ?? []);
}

const styles = StyleSheet.create({
  input: {
    marginBottom: 20,
  },
});

const Container = styled.View``;

const Title = styled(Text)`
  ${fontStyles.medium};
  font-variant: tabular-nums;
`;

const Description = styled(Text)`
  ${fontStyles.regular};
  font-family: ${appFont.regular};
  color: ${({ theme }) => theme.colors.basic020};
`;
