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
import { InteractionManager } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import { useDispatch } from 'react-redux';
import t from 'translations/translate';

// actions
import {
  addKeyBasedAssetToTransferAction,
  removeKeyBasedAssetToTransferAction,
} from 'actions/keyBasedAssetTransferActions';

// components
import Button from 'components/Button';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import ValueInput from 'components/ValueInput';

// Selectors
import { useRootSelector } from 'selectors';

// utils
import { mapAssetDataToAssetOption } from 'utils/assets';
import { formatAmount } from 'utils/common';
import { spacing } from 'utils/variables';

// types
import type { AssetData } from 'models/Asset';

function KeyBasedAssetTransferEditAmount() {
  const navigation = useNavigation();
  const assetData: AssetData = navigation.getParam('assetData');
  const initialValue: ?number = navigation.getParam('value');

  const inputRef = React.useRef();

  const [value, setValue] = React.useState(initialValue != null ? formatAmount(initialValue, assetData.decimals) : '');
  const [isValid, setIsValid] = React.useState(true);

  const dispatch = useDispatch();
  const balances = useRootSelector((root) => root.keyBasedAssetTransfer.availableBalances);
  const rates = useRootSelector((root) => root.rates.data);
  const fiatCurrency = useRootSelector((root) => root.appSettings.data.baseFiatCurrency);

  const assetOption = mapAssetDataToAssetOption(assetData, balances, rates, fiatCurrency);

  const handleSubmit = () => {
    dispatch(removeKeyBasedAssetToTransferAction(assetData));
    dispatch(addKeyBasedAssetToTransferAction(assetData, +value));
    navigation.goBack(null);
  };

  React.useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      inputRef.current?.focus();
    });
  }, []);

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{ title: t('transactions.title.amountEditScreen') }],
      }}
      footer={
        <FooterContent>
          <Button title={t('button.confirm')} onPress={handleSubmit} disabled={!isValid} />
        </FooterContent>
      }
      shouldFooterAvoidKeyboard
    >
      <Content>
        <ValueInput
          value={value}
          onValueChange={setValue}
          assetData={assetOption}
          customAssets={[]}
          customBalances={balances}
          onFormValid={setIsValid}
          getInputRef={(ref) => { inputRef.current = ref; }}
        />
      </Content>
    </ContainerWithHeader>
  );
}

export default KeyBasedAssetTransferEditAmount;

const Content = styled.View`
  flex: 1;
  padding: ${spacing.largePlus}px 40px ${spacing.large}px;
`;

const FooterContent = styled.View`
  width: 100%;
  padding: ${spacing.small}px ${spacing.large}px ${spacing.large}px;
`;
