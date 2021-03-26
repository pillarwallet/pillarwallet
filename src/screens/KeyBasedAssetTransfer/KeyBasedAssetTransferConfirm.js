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

import React from 'react';
import { useNavigation } from 'react-navigation-hooks';
import styled from 'styled-components/native';
import { formatEther } from 'ethers/lib/utils';
import { orderBy } from 'lodash';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import * as Form from 'components/modern/Form';
import ContainerWithHeader from 'components/Layout/ContainerWithHeader';
import FeeForm from 'components/modern/FeeForm';
import Spinner from 'components/Spinner';

// Constants
import { COLLECTIBLES } from 'constants/assetsConstants';
import { KEY_BASED_ASSET_TRANSFER_UNLOCK } from 'constants/navigationConstants';

// Selectors
import { useRootSelector, useRates, useFiatCurrency, activeAccountAddressSelector } from 'selectors';

// Utils
import { getBalanceInFiat, getFormattedBalanceInFiat } from 'utils/assets';
import { BigNumber, formatTokenAmount, humanizeHexString } from 'utils/common';
import { spacing } from 'utils/variables';

// Types
import type { Rates, KeyBasedAssetTransfer } from 'models/Asset';

const KeyBasedAssetTransferConfirm = () => {
  const { t, tRoot } = useTranslationWithPrefix('smartWalletContent.confirm');
  const navigation = useNavigation();

  const rates = useRates();
  const fiatCurrency = useFiatCurrency();

  const keyBasedAssetsToTransfer = useRootSelector((root) => root.keyBasedAssetTransfer.data);
  const availableBalances = useRootSelector((root) => root.keyBasedAssetTransfer.availableBalances);
  const isCalculatingGas = useRootSelector(root => root.keyBasedAssetTransfer.isCalculatingGas);

  const activeAccountAddress = useRootSelector(activeAccountAddressSelector);
  const keyBasedWalletAddress = useRootSelector(root => root.wallet.data?.address);

  if (isCalculatingGas) return (
    <ContainerWithHeader headerProps={{ centerItems: [{ title: t('title') }] }}>
      <SpinnerContent>
        <Spinner />
      </SpinnerContent>
    </ContainerWithHeader>
  );

  const renderItem = ({ assetData, amount }: KeyBasedAssetTransfer, index: number) => {
    if (assetData.tokenType === COLLECTIBLES) {
      return <Form.Item title={assetData.name} value={tRoot('label.collectible')} separator={index !== 0} />;
    }

    const valueInEth = tRoot('tokenValue', {
      value: formatTokenAmount(amount ?? 0, assetData.token),
      token: assetData.token,
    });
    const valueInFiat = getFormattedBalanceInFiat(fiatCurrency, amount ?? 0, rates, assetData.token);

    return (
      <Form.ItemRow separator={index !== 0}>
        <Form.ItemTitle>{assetData.name}</Form.ItemTitle>

        <Form.ItemValue fontVariant="tabular-nums">{valueInEth}</Form.ItemValue>

        {!!valueInFiat && (
          <Form.ItemValue variant="secondary" fontVariant="tabular-nums">
            {valueInFiat}
          </Form.ItemValue>
        )}
      </Form.ItemRow>
    );
  };

  const sortedAssetTransfers = sortAssetTransfers(keyBasedAssetsToTransfer, rates, fiatCurrency);

  const totalFee = getTotalFee(keyBasedAssetsToTransfer);

  return (
    <ContainerWithHeader headerProps={{ centerItems: [{ title: t('title') }] }}>
      <Content>
        <Form.Header>{t('details.header')}</Form.Header>
        <Form.Item
          title={t('details.fromKeyWallet')}
          value={humanizeHexString(keyBasedWalletAddress)}
          fontVariant="tabular-nums"
          separator={false}
        />
        <Form.Item
          title={t('details.toSmartWallet')}
          value={humanizeHexString(activeAccountAddress)}
          fontVariant="tabular-nums"
        />

        <Form.Header>{t('assets.header')}</Form.Header>
        {sortedAssetTransfers.map(renderItem)}

        <FeeForm fee={totalFee} />
      </Content>
    </ContainerWithHeader>
  );
};

export default KeyBasedAssetTransferConfirm;

const Content = styled.View`
  padding: 0 ${spacing.large}px;
`;

const SpinnerContent = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const getTotalFee = (assetTransfers: KeyBasedAssetTransfer[]) => {
  let result = BigNumber(0);

  assetTransfers.forEach(({ calculatedGasLimit, gasPrice }) => {
    const txFee = BigNumber(calculatedGasLimit ?? 0).multipliedBy(formatEther(gasPrice ?? 0));
    result = result.plus(txFee);
  });

  return result;
};

const sortAssetTransfers = (
  assetTransfers: KeyBasedAssetTransfer[],
  rates: Rates,
  fiatCurrency: string,
): KeyBasedAssetTransfer[] => {
  return orderBy(
    assetTransfers,
    [
      (transfer: KeyBasedAssetTransfer) => (transfer.assetData.tokenType !== COLLECTIBLES ? 1 : 0),
      (transfer: KeyBasedAssetTransfer) =>
        getBalanceInFiat(fiatCurrency, transfer.amount ?? 0, rates, transfer.assetData.token) ?? 0,
      (transfer: KeyBasedAssetTransfer) => transfer.assetData.name?.trim().toLowerCase(),
    ],
    ['desc', 'desc', 'asc'],
  );
};
