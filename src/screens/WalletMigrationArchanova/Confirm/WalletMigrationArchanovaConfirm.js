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
import { useNavigation } from 'react-navigation-hooks';
import { useTranslationWithPrefix } from 'translations/translate';
import styled from 'styled-components/native';

// Components
import { Container, Content } from 'components/modern/Layout';
import * as Table from 'components/modern/Table';
import BalanceView from 'components/BalanceView';
import Button from 'components/modern/Button';
import FeeTable from 'components/modern/FeeTable';
import HeaderBlock from 'components/HeaderBlock';
import Image from 'components/Image';
import Text from 'components/modern/Text';


// Constants
import { ETH, COLLECTIBLES } from 'constants/assetsConstants';
import { KEY_BASED_ASSET_TRANSFER_UNLOCK } from 'constants/navigationConstants';
import { CHAIN } from 'constants/chainConstants';

// Selectors
import { useRootSelector, useFiatCurrency, activeAccountAddressSelector, useChainRates } from 'selectors';

// Utils
import { BigNumber, formatTokenAmount, humanizeHexString } from 'utils/common';
import { useThemedImages } from 'utils/images';
import { spacing } from 'utils/variables';

// Types
import type { AssetToMigrate } from 'models/WalletMigrationArchanova';

function WalletMigrationArchanovaConfirm() {
  const navigation = useNavigation();
  const { t, tRoot } = useTranslationWithPrefix('walletMigrationArchanova.confirm');

  const ethereumRates = useChainRates(CHAIN.ETHEREUM);
  const fiatCurrency = useFiatCurrency();
  const etherspotAccountAddress = useRootSelector(activeAccountAddressSelector);
  const archanovaAccountAddress = useRootSelector((root) => root.wallet.data?.address);

  const images = useThemedImages();

  const assetsToMigrate: AssetToMigrate[] = navigation.getParam('assetsToMigrate') ?? [];

  const hasEnoughGas = true;
  const totalValue = BigNumber(0);
  const totalFee = BigNumber(0);
  const sortedAssetTransfers = [];

  const renderItem = () => null;
  const handleSubmit = () => {};

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />

      <Content>
        <Header>
          <SmartWalletLogo source={images.smartWalletIcon} />
          <BalanceLabel>{t('header')}</BalanceLabel>
          <BalanceView fiatCurrency={fiatCurrency} balance={totalValue} />
        </Header>

        <Table.Header>{t('details.header')}</Table.Header>
        <Table.Row
          title={t('details.fromKeyWallet')}
          value={humanizeHexString(archanovaAccountAddress)}
          fontVariant="tabular-nums"
          separator={false}
        />
        <Table.Row
          title={t('details.toSmartWallet')}
          value={humanizeHexString(etherspotAccountAddress)}
          fontVariant="tabular-nums"
        />

        <Table.Header>{t('assets.header')}</Table.Header>
        {sortedAssetTransfers.map(renderItem)}

        <FeeTable fee={totalFee} symbol={ETH} chain={CHAIN.ETHEREUM} />

        <Button
          title={hasEnoughGas ? t('submit') : tRoot('label.notEnoughGas')}
          onPress={handleSubmit}
          disabled={!hasEnoughGas}
        />
      </Content>
    </Container>
  );
}

export default WalletMigrationArchanovaConfirm;

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