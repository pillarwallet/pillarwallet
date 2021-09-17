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
import { useDispatch } from 'react-redux';
import { BigNumber } from 'bignumber.js';
import styled from 'styled-components/native';
import t from 'translations/translate';

// Components
import Button from 'components/legacy/Button';
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import TokenValueInput from 'components/inputs/TokenValueInput';
import TokenBalanceAccessory from 'components/inputs/TokenValueInput/TokenBalanceAccessory';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Selectors
import { useRootSelector } from 'selectors';

// Actions
import {
  addKeyBasedAssetToTransferAction,
  removeKeyBasedAssetToTransferAction,
} from 'actions/keyBasedAssetTransferActions';

// Utils
import { mapAssetDataToAsset } from 'utils/assets';
import { wrapBigNumberOrNil } from 'utils/bigNumber';
import { valueForAddress } from 'utils/common';
import { isValidValueForTransfer, isLessThanOrEqualToBalance } from 'utils/transactions';
import { spacing } from 'utils/variables';

// Types
import type { TokenData } from 'models/Asset';

function KeyBasedAssetTransferEditAmount() {
  const navigation = useNavigation();
  const assetData: ?TokenData = navigation.getParam('assetData');
  const initialValue: ?number = navigation.getParam('value');

  const inputRef = React.useRef();

  const balance = useAssetBalance(assetData?.contractAddress);

  const [value, setValue] = React.useState<?BigNumber>(wrapBigNumberOrNil(initialValue));

  const dispatch = useDispatch();

  React.useEffect(() => {
    const promise = InteractionManager.runAfterInteractions(() => inputRef.current?.focus());
    return () => { promise?.cancel(); };
  }, []);

  // Fail safe
  if (!assetData) {
    return (
      <ContainerWithHeader
        headerProps={{
          centerItems: [{ title: t('transactions.title.amountEditScreen') }],
        }}
      />
    );
  }

  const isValidValue = isValidValueForTransfer(value, balance);
  const hasEnoughBalance = isLessThanOrEqualToBalance(value, balance);

  const handleUseMax = () => {
    setValue(balance);
  };

  const handleSubmit = () => {
    if (!assetData || !value) return;

    dispatch(removeKeyBasedAssetToTransferAction(assetData));
    dispatch(addKeyBasedAssetToTransferAction(assetData, value));
    navigation.goBack(null);
  };

  const asset = assetData ? mapAssetDataToAsset(assetData, CHAIN.ETHEREUM) : null;

  const buttonTitle = hasEnoughBalance ? t('button.confirm') : t('label.notEnoughBalance', { symbol: asset?.symbol });

  return (
    <ContainerWithHeader
      headerProps={{
        centerItems: [{ title: t('transactions.title.amountEditScreen') }],
      }}
      footer={
        <FooterContent>
          <Button title={buttonTitle} onPress={handleSubmit} disabled={!isValidValue} />
        </FooterContent>
      }
      shouldFooterAvoidKeyboard
    >
      <Content>
        <TokenValueInput
          // $FlowFixMe: ref type inference
          ref={inputRef}
          value={value}
          onValueChange={setValue}
          maxValue={balance}
          referenceValue={balance}
          chain={CHAIN.ETHEREUM}
          asset={asset}
        />
        <TokenBalanceAccessory balance={balance} onUseMax={handleUseMax} chain={CHAIN.ETHEREUM} asset={asset} />
      </Content>
    </ContainerWithHeader>
  );
}

export default KeyBasedAssetTransferEditAmount;

function useAssetBalance(address: ?string) {
  const keyWalletBalances = useRootSelector((root) => root.keyBasedAssetTransfer.availableBalances);

  const balance = valueForAddress(keyWalletBalances, address)?.balance;
  return BigNumber(balance ?? 0);
}

const Content = styled.View`
  flex: 1;
  padding: ${spacing.largePlus}px 20px ${spacing.large}px;
`;

const FooterContent = styled.View`
  width: 100%;
  padding: ${spacing.small}px ${spacing.large}px ${spacing.mediumLarge}px;
`;
