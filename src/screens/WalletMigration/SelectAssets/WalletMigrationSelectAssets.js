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

// Components
import { Container, Content } from 'components/modern/Layout';
import HeaderBlock from 'components/HeaderBlock';

// Selectors
import { useRootSelector } from 'selectors';
import { achanovaAccountSelector } from 'selectors/archanova';

// Local
import WalletSummary from './WalletSummary';

const WalletMigrationSelectAssets = () => {
  const { t } = useTranslationWithPrefix('walletMigration.etherspot.selectAssets');
  const navigation = useNavigation();

  const archanovaAccount = useRootSelector(achanovaAccountSelector);

  const walletAddress = archanovaAccount?.id ?? '';
  const totalValue = 0;

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />

      <Content>
        <WalletSummary address={walletAddress} totalValueInFiat={totalValue} />
      </Content>
    </Container>
  );
};

export default WalletMigrationSelectAssets;
