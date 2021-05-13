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
import { SectionList, useWindowDimensions } from 'react-native';
import { useNavigation } from 'react-navigation-hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styled from 'styled-components/native';
import { useTranslation, useTranslationWithPrefix } from 'translations/translate';
import { isEqual, chunk } from 'lodash';

// Components
import { Container, Center } from 'components/modern/Layout';
import HeaderBlock from 'components/HeaderBlock';
import TabBar from 'components/modern/TabBar';
import Text from 'components/modern/Text';
import FloatingButtons from 'components/FloatingButtons';
import Modal from 'components/Modal';
import Spinner from 'components/Spinner';
import Stories from 'components/Stories';
import WalletConnectRequests from 'screens/WalletConnect/Requests';

// Selectors
import { useSupportedChains, useIsDeployedOnEthereum } from 'selectors/smartWallet';

// Services
import { useFetchWalletConnectAppsQuery } from 'services/cms/WalletConnectApps';
import { useFetchWalletConnectCategoriesQuery } from 'services/cms/WalletConnectCategories';

// Utils
import { mapNotNil } from 'utils/array';
import { appFont, fontStyles, spacing } from 'utils/variables';
import { useChainsConfig } from 'utils/uiConfig';

// Types
import type { SectionBase } from 'utils/types/react-native';
import { type Chain, CHAIN } from 'models/Chain';
import type { WalletConnectApp } from 'models/WalletConnect';


function WalletConnectConnectedApps() {
  const { t } = useTranslationWithPrefix('walletConnect.connectedApps');
  const navigation = useNavigation();
  const safeArea = useSafeAreaInsets();

  const [activeChain, setActiveChain] = React.useState<?Chain>(null);

  return (
    <Container>
      <HeaderBlock centerItems={[{ title: t('title') }]} navigation={navigation} noPaddingTop />
    </Container>
  );
}

export default WalletConnectConnectedApps;

