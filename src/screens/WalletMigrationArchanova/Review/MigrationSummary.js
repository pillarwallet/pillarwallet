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
import styled from 'styled-components/native';
import { BigNumber } from 'bignumber.js';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import * as Table from 'components/layout/Table';
import BalanceView from 'components/BalanceView';
import FeeTable from 'components/display/FeeTable';
import Image from 'components/Image';
import Text from 'components/core/Text';
import WarningBlock from 'components/HighGasFeeModals/WarningBlock';

// Constants
import { CHAIN } from 'constants/chainConstants';

// Selectors
import { useFiatCurrency } from 'selectors';

// Utils
import { humanizeHexString } from 'utils/common';
import { formatTokenValue, formatFiatValue } from 'utils/format';
import { useThemedImages } from 'utils/images';
import { sumBy } from 'utils/number';
import { spacing } from 'utils/variables';
import { useThemeColors } from 'utils/themes';

// Types
import type { Account } from 'models/Account';
import type { Collectible } from 'models/Collectible';

// Local
import { type AssetItem, type TokenItem } from './utils';

type Props = {|
  etherspotAccount: ?Account,
  archanovaAccount: ?Account,
  items: AssetItem[],
  feeInEth: ?BigNumber,
  highFee?: boolean,
|};

function MigrationSummary({ etherspotAccount, archanovaAccount, items, feeInEth, highFee = false }: Props) {
  const chain = CHAIN.ETHEREUM;

  const { t, tRoot } = useTranslationWithPrefix('walletMigrationArchanova.review');
  const images = useThemedImages();
  const colors = useThemeColors();

  const currency = useFiatCurrency();

  const totalValue = sumBy(items, (item) => (item.token ? item.balanceInFiat : 0));

  const renderItem = (item: AssetItem, index: number) =>
    item.collectible ? renderCollectibleItem(item.collectible, index) : renderTokenItem(item, index);

  const renderTokenItem = ({ token, balance, balanceInFiat }: TokenItem, index: number) => (
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

  const renderCollectibleItem = (collectible: Collectible, index: number) => (
    <Table.Row
      key={collectible.contractAddress}
      title={collectible.name}
      value={tRoot('label.collectible')}
      separator={index !== 0}
    />
  );

  return (
    <Container>
      <Header>
        <SmartWalletLogo source={images.smartWalletIcon} />
        <BalanceLabel>{t('header')}</BalanceLabel>
        <BalanceView fiatCurrency={currency} balance={totalValue} />
      </Header>

      <Table.Header>{t('details.header')}</Table.Header>
      <Table.Row
        title={t('details.fromWallet')}
        value={humanizeHexString(archanovaAccount?.id)}
        fontVariant="tabular-nums"
        separator={false}
      />
      <Table.Row
        title={t('details.toWallet')}
        value={humanizeHexString(etherspotAccount?.id)}
        fontVariant="tabular-nums"
      />

      <Table.Header>{t('assets.header')}</Table.Header>
      {items.map(renderItem)}

      {feeInEth && <FeeTable fee={feeInEth} chain={chain} />}

      {feeInEth && highFee && (
        <WarningBlock
          text={tRoot('transactions.highGasFee.warningLabel')}
          icon="small-warning"
          backgroundColor={colors.negative}
          right={10}
        />
      )}
    </Container>
  );
}

export default MigrationSummary;

const Container = styled.View``;

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
