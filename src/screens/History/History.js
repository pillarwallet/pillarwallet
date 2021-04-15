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
import { Container } from 'components/modern/Layout';
import HeaderBlock from 'components/HeaderBlock';

// Selectors
import { useSmartWalletType, SMART_WALLET_TYPES } from 'selectors/smartWallet';

// Local
import HistoryListEtherspot from './HistoryListEtherspot';
import HistoryListArchanova from './HistoryListArchanova';


function HistoryScreen() {
  const { t } = useTranslationWithPrefix('history');
  const navigation = useNavigation();

  const walletType = useSmartWalletType();

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />

      {/* Extracted as separete HistoryList components because you cannot conditionally call hooks. */}
      {walletType === SMART_WALLET_TYPES.ETHERSPOT && <HistoryListEtherspot />}
      {walletType === SMART_WALLET_TYPES.ARCHANOVA && <HistoryListArchanova />}
    </Container>
  );
}

export default HistoryScreen;
