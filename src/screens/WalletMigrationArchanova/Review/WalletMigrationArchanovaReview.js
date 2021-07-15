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
import { ETH, ADDRESS_ZERO } from 'constants/assetsConstants';
import { CHAIN } from 'constants/chainConstants';

// Selectors
import { useRootSelector, useFiatCurrency } from 'selectors';
import { etherspotAccountSelector, achanovaAccountSelector } from 'selectors/accounts';
import { useTotalMigrationValueInFiat } from 'selectors/walletMigrationArchanova';

// Utils
import { BigNumber, humanizeHexString } from 'utils/common';
import { formatTokenValue, formatFiatValue } from 'utils/format';
import { useThemedImages } from 'utils/images';
import { spacing } from 'utils/variables';

// Types
import type { Collectible } from 'models/Collectible';

// Local
import { useAssetItems, type AssetItem, type TokenItem } from './utils';


function WalletMigrationArchanovaConfirm() {
  const navigation = useNavigation();
  const { t, tRoot } = useTranslationWithPrefix('walletMigrationArchanova.review');

  const etherspotAccount = useRootSelector(etherspotAccountSelector);
  const archanovaAccount = useRootSelector(achanovaAccountSelector);

  const currency = useFiatCurrency();

  const images = useThemedImages();

  const assets = useAssetItems();

  const hasEnoughGas = true;
  const totalValue = useTotalMigrationValueInFiat();
  const totalFee = BigNumber(0);

  const renderItem = (item: AssetItem, index: number) =>
    item.collectible ? renderCollectibleItem(item.collectible, index) : renderTokenItem(item, index);

  const renderTokenItem = ({ token, balance, balanceInFiat }: TokenItem, index: number) => {
    return (
      <Table.RowContainer key={token.address} separator={index !== 0}>
        <Table.RowTitle>{token.name}</Table.RowTitle>
        <Table.RowValue fontVariant="tabular-nums">{formatTokenValue(balance, token.symbol)}</Table.RowValue>
        {!!balanceInFiat && (
          <Table.RowValue variant="secondary" fontVariant="tabular-nums">
            {formatFiatValue(balanceInFiat, currency)}
          </Table.RowValue>
        )}
      </Table.RowContainer>
    );
  };

  const renderCollectibleItem = (collectible: Collectible, index: number) => {
    return (
      <Table.Row
        key={collectible.contractAddress}
        title={collectible.name}
        value={tRoot('label.collectible')}
        separator={index !== 0}
      />
    );
  };

  const estimateTotalTransactionFees = () => {

  };

  //  const renderToken = (token: ) => null;
  const handleSubmit = () => {};

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />

      <Content>
        <Header>
          <SmartWalletLogo source={images.smartWalletIcon} />
          <BalanceLabel>{t('header')}</BalanceLabel>
          <BalanceView fiatCurrency={currency} balance={totalValue} />
        </Header>

        <Table.Header>{t('details.header')}</Table.Header>
        <Table.Row
          title={t('details.fromKeyWallet')}
          value={humanizeHexString(archanovaAccount?.id)}
          fontVariant="tabular-nums"
          separator={false}
        />
        <Table.Row
          title={t('details.toSmartWallet')}
          value={humanizeHexString(etherspotAccount?.id)}
          fontVariant="tabular-nums"
        />

        <Table.Header>{t('assets.header')}</Table.Header>
        {assets.map(renderItem)}

        <FeeTable fee={totalFee} assetAddress={ADDRESS_ZERO} assetSymbol={ETH} chain={CHAIN.ETHEREUM} />

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
