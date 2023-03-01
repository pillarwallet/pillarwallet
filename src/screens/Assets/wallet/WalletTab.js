// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

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
import FloatingButtons from 'components/FloatingButtons';
import Modal from 'components/Modal';

// Screens
import ReceiveModal from 'screens/Asset/ReceiveModal';

// Constants
import { BRIDGE_FLOW, SEND_TOKEN_FROM_HOME_FLOW, ADD_CASH } from 'constants/navigationConstants';

// Selectors
import { useRootSelector, useIsExchangeAvailable, useActiveAccount, activeAccountAddressSelector } from 'selectors';

// Utils
import { isKeyBasedAccount } from 'utils/accounts';

// Local
import WalletTabScrollContent from './WalletTabScrollContent';

type Props = {
  isNavigateToHome?: boolean,
};

function WalletTab({ isNavigateToHome }: Props) {
  const { tRoot } = useTranslationWithPrefix('assets.wallet');
  const navigation = useNavigation();

  const activeAccount = useActiveAccount();
  const accountAddress = useRootSelector(activeAccountAddressSelector);

  const isExchangeAvailable = useIsExchangeAvailable();

  const [hasPositiveBalance, setHasPositiveBalance] = React.useState(true);

  const showReceiveModal = () => {
    Modal.open(() => <ReceiveModal address={accountAddress} />);
  };

  const buttons = [
    hasPositiveBalance && {
      title: tRoot('button.receive'),
      iconName: 'qrcode',
      onPress: showReceiveModal,
    },
    isExchangeAvailable &&
    hasPositiveBalance && {
      title: tRoot('button.swap'),
      iconName: 'exchange',
      onPress: () => navigation.navigate(BRIDGE_FLOW),
    },
    hasPositiveBalance && {
      title: tRoot('button.send'),
      iconName: 'send',
      onPress: () => navigation.navigate(SEND_TOKEN_FROM_HOME_FLOW),
    },
    !isKeyBasedAccount(activeAccount) &&
    !hasPositiveBalance && {
      title: tRoot('button.addCash'),
      iconName: 'plus',
      onPress: () => navigation.navigate(ADD_CASH),
    },
  ];

  return (
    <Container>
      <WalletTabScrollContent isNavigateToHome={isNavigateToHome} hasPositiveBalance={setHasPositiveBalance} />
      <FloatingButtons items={buttons} />
    </Container>
  );
}

export default WalletTab;

const Container = styled.View`
  flex: 1;
`;
