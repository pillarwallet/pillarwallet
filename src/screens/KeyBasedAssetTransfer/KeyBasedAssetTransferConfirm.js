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
import * as Table from 'components/layout/Table';
import BalanceView from 'components/BalanceView';
import Button from 'components/legacy/Button';
import ContainerWithHeader from 'components/legacy/Layout/ContainerWithHeader';
import FeeTable from 'components/display/FeeTable';
import Image from 'components/Image';
import Spinner from 'components/Spinner';
import Text from 'components/core/Text';

// Constants
import { ETH, ASSET_TYPES } from 'constants/assetsConstants';
import { KEY_BASED_ASSET_TRANSFER_UNLOCK } from 'constants/navigationConstants';
import { CHAIN } from 'constants/chainConstants';

// Selectors
import {
  useRootSelector,
  useFiatCurrency,
  activeAccountAddressSelector,
  useChainRates,
} from 'selectors';

// Utils
import { getBalanceBN, getBalanceInFiat, getFormattedBalanceInFiat } from 'utils/assets';
import { BigNumber, formatTokenAmount, humanizeHexString } from 'utils/common';
import { useThemedImages } from 'utils/images';
import { spacing } from 'utils/variables';
import { nativeAssetPerChain } from 'utils/chains';

// Types
import type { KeyBasedAssetTransfer } from 'models/Asset';
import type { WalletAssetsBalances } from 'models/Balances';
import type { Currency, RatesByAssetAddress } from 'models/Rates';

const KeyBasedAssetTransferConfirm = () => {
  const { t, tRoot } = useTranslationWithPrefix('smartWalletContent.confirm');
  const navigation = useNavigation();

  const ethereumRates = useChainRates(CHAIN.ETHEREUM);
  const fiatCurrency = useFiatCurrency();

  const assetTransfers = useRootSelector((root) => root.keyBasedAssetTransfer.data);
  const keyWalletBalances = useRootSelector((root) => root.keyBasedAssetTransfer.availableBalances);
  const isCalculatingGas = useRootSelector(root => root.keyBasedAssetTransfer.isCalculatingGas);

  const activeAccountAddress = useRootSelector(activeAccountAddressSelector);
  const keyBasedWalletAddress = useRootSelector(root => root.wallet.data?.address);

  const images = useThemedImages();

  if (isCalculatingGas) {
    return (
      <ContainerWithHeader headerProps={{ centerItems: [{ title: t('title') }] }}>
        <SpinnerContent>
          <Spinner />
        </SpinnerContent>
      </ContainerWithHeader>
    );
  }

  const handleSubmit = () => navigation.navigate(KEY_BASED_ASSET_TRANSFER_UNLOCK);

  const renderItem = ({ assetData, amount }: KeyBasedAssetTransfer, index: number) => {
    if (assetData.tokenType === ASSET_TYPES.COLLECTIBLE) {
      return (
        <Table.Row
          key={assetData.id}
          title={assetData.name}
          value={tRoot('label.collectible')}
          separator={index !== 0}
        />
      );
    }

    const valueInEth = tRoot('tokenValue', {
      value: formatTokenAmount(amount ?? 0, assetData.token),
      token: assetData.token,
    });
    const valueInFiat = getFormattedBalanceInFiat(fiatCurrency, amount ?? 0, ethereumRates, assetData.contractAddress);

    return (
      <Table.RowContainer key={assetData.token} separator={index !== 0}>
        <Table.RowTitle>{assetData.name}</Table.RowTitle>

        <Table.RowValue fontVariant="tabular-nums">{valueInEth}</Table.RowValue>

        {!!valueInFiat && (
          <Table.RowValue variant="secondary" fontVariant="tabular-nums">
            {valueInFiat}
          </Table.RowValue>
        )}
      </Table.RowContainer>
    );
  };

  const sortedAssetTransfers = sortAssetTransfers(assetTransfers, ethereumRates, fiatCurrency);

  const totalValue = getTotalValue(assetTransfers, ethereumRates, fiatCurrency);
  const totalFee = getTotalFee(assetTransfers);

  const remainingEthBalance = getRemainingBalance(
    keyWalletBalances,
    assetTransfers,
    nativeAssetPerChain.ethereum.address,
  );
  const hasEnoughGas = remainingEthBalance.gte(totalFee);

  return (
    <ContainerWithHeader
      headerProps={{ centerItems: [{ title: t('title') }] }}
      footer={
        <FooterContent>
          <Button
            title={hasEnoughGas ? t('submit') : tRoot('label.notEnoughGas')}
            onPress={handleSubmit}
            disabled={!hasEnoughGas}
          />
        </FooterContent>
      }
      putContentInScrollView
    >
      <Content>
        <Header>
          <SmartWalletLogo source={images.smartWalletIcon} />
          <BalanceLabel>{t('header')}</BalanceLabel>
          <BalanceView fiatCurrency={fiatCurrency} balance={totalValue} />
        </Header>

        <Table.Header>{t('details.header')}</Table.Header>
        <Table.Row
          title={t('details.fromKeyWallet')}
          value={humanizeHexString(keyBasedWalletAddress)}
          fontVariant="tabular-nums"
          separator={false}
        />
        <Table.Row
          title={t('details.toSmartWallet')}
          value={humanizeHexString(activeAccountAddress)}
          fontVariant="tabular-nums"
        />

        <Table.Header>{t('assets.header')}</Table.Header>
        {sortedAssetTransfers.map(renderItem)}

        <FeeTable
          fee={totalFee}
          assetSymbol={ETH}
          assetAddress={nativeAssetPerChain.ethereum.address}
          chain={CHAIN.ETHEREUM}
        />
      </Content>
    </ContainerWithHeader>
  );
};

export default KeyBasedAssetTransferConfirm;

const getRemainingBalance = (
  balances: WalletAssetsBalances,
  assetTransfers: KeyBasedAssetTransfer[],
  tokenAddress: string,
) => {
  const balance = getBalanceBN(balances, tokenAddress);
  const transfer = assetTransfers.find(({ assetData }) => assetData?.token === ETH);

  return transfer ? balance.minus(transfer.amount ?? 0) : balance;
};

const getTotalValue = (assetTransfers: KeyBasedAssetTransfer[], rates: RatesByAssetAddress, fiatCurrency: Currency) => {
  let result = 0;

  assetTransfers.forEach(({ assetData, amount }) => {
    result += getBalanceInFiat(fiatCurrency, amount ?? 0, rates, assetData.contractAddress);
  });

  return result;
};

const getTotalFee = (assetTransfers: KeyBasedAssetTransfer[]) => {
  let result = BigNumber(0);

  assetTransfers.forEach(({ calculatedGasLimit, gasPrice }) => {
    const txFee = BigNumber(calculatedGasLimit ?? 0).multipliedBy(formatEther(gasPrice?.toString() ?? 0));
    result = result.plus(txFee);
  });

  return result;
};

const sortAssetTransfers = (
  assetTransfers: KeyBasedAssetTransfer[],
  rates: RatesByAssetAddress,
  fiatCurrency: Currency,
): KeyBasedAssetTransfer[] => {
  return orderBy(
    assetTransfers,
    [
      (transfer: KeyBasedAssetTransfer) => (transfer.assetData.tokenType !== ASSET_TYPES.COLLECTIBLE ? 1 : 0),
      (transfer: KeyBasedAssetTransfer) =>
        getBalanceInFiat(fiatCurrency, transfer.amount ?? 0, rates, transfer.assetData.contractAddress) ?? 0,
      (transfer: KeyBasedAssetTransfer) => transfer.assetData.name?.trim().toLowerCase(),
    ],
    ['desc', 'desc', 'asc'],
  );
};

const Content = styled.View`
  padding: 0 ${spacing.large}px ${spacing.large}px;
`;

const SpinnerContent = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

const Header = styled.View`
  align-items: center;
  padding-vertical: ${spacing.mediumLarge}px;
`;

const SmartWalletLogo = styled(Image)`
  height: 64px;
  width: 64px;
  margin-vertical: ${spacing.mediumLarge}px;
`;

const BalanceLabel = styled(Text)`
  margin-vertical: ${spacing.mediumLarge}px;
`;

const FooterContent = styled.View`
  width: 100%;
  padding: ${spacing.small}px ${spacing.large}px ${spacing.mediumLarge}px;
`;
