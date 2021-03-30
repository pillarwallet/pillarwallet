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
import styled from 'styled-components/native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import { Container, Content } from 'components/modern/Layout';
import Button from 'components/Button';
import FloatingButtons from 'components/FloatingButtons';
import HeaderBlock from 'components/HeaderBlock';
import UserNameAndImage from 'components/UserNameAndImage';

// Constants
import {
  ASSETS,
  CONNECT_FLOW,
  EXCHANGE_FLOW,
  MENU,
  SEND_TOKEN_FROM_HOME_FLOW,
  SERVICES_FLOW,
} from 'constants/navigationConstants';

// Selectors
import { useRootSelector } from 'selectors';
import { totalBalanceSelector } from 'selectors/balances';
import { useUser } from 'selectors/user';

import BalanceSection from './BalanceSection';

const walletConnectIcon = require('assets/icons/icon-24-wallet-connect.png');

function Home() {
  const { t } = useTranslationWithPrefix('home');
  const navigation = useNavigation();

  const user = useUser();
  const totalBalance = useRootSelector(totalBalanceSelector);
  
  // TODO:
  // 1. Extract FloatingButtons as ActionButtons
  // 2. Update icons globally

    // const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWalletState);
    // const isSendButtonActive =
    //   getTotalBalanceInFiat(activeAccountBalances, rates, fiatCurrency) &&
    //   isEmpty(smartWalletStatus?.sendingBlockedMessage);

  const floatingButtons = [
    {
      title: t('actions.send'),
      iconName: 'send',
      onPress: () => navigation.navigate(SEND_TOKEN_FROM_HOME_FLOW),
    },
    {
      title: t('actions.swap'),
      iconName: 'exchange',
      onPress: () => navigation.navigate(EXCHANGE_FLOW),
    },
    {
      title: t('actions.connect'),
      iconSource: walletConnectIcon,
      onPress: () => navigation.navigate(CONNECT_FLOW),
    },
  ];

  return (
    <Container>
      <HeaderBlock
        leftItems={[
          {
            icon: 'hamburger',
            onPress: () => navigation.navigate(MENU),
            iconProps: { secondary: true, style: { marginLeft: -4 } },
          },
        ]}
        centerItems={[{ custom: <UserNameAndImage user={user} /> }]}
        navigation={navigation}
        noPaddingTop
      />
      <Content contentContainerStyle={{ paddingBottom: FloatingButtons.SCROLL_VIEW_BOTTOM_INSET }}>
        <BalanceSection />

        {/* Temporary navigation section */}
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <NavButton title="Assets" onPress={() => navigation.navigate(ASSETS)} secondary />
        {/* eslint-disable-next-line i18next/no-literal-string */}
        <NavButton title="Sevices" onPress={() => navigation.navigate(SERVICES_FLOW)} secondary />
      </Content>

      <FloatingButtons items={floatingButtons} />
    </Container>
  );
}

export default Home;

const NavButton = styled(Button)`
  width: 100%;
  align-self: center;
  margin: 20px 20px 0;
`;
