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
import { isEmpty } from 'lodash';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import FloatingButtons from 'components/FloatingButtons';
import Modal from 'components/Modal';
import ReceiveModal from 'screens/Asset/ReceiveModal';

// Constants
import { CONNECT_FLOW, EXCHANGE_FLOW, SEND_TOKEN_FROM_HOME_FLOW } from 'constants/navigationConstants';

// Selectors
import { useRootSelector, activeAccountAddressSelector } from 'selectors';
import { totalBalanceSelector } from 'selectors/balances';
import { useSmartWalletStatus } from 'selectors/smartWallet';

function FloatingActions() {
  const { t } = useTranslationWithPrefix('home.actions');
  const navigation = useNavigation();

  const address = useRootSelector(activeAccountAddressSelector);

  const { isSendEnabled, isExchangeEnabled } = useEnabledActions();

  const showReceiveModal = () => {
    Modal.open(() => <ReceiveModal address={address} />);
  };

  const items = [
    {
      title: t('receive'),
      iconName: 'qrcode',
      onPress: showReceiveModal,
    },
    {
      title: t('swap'),
      iconName: 'exchange',
      onPress: () => navigation.navigate(EXCHANGE_FLOW),
      disabled: !isExchangeEnabled,
    },
    {
      title: t('send'),
      iconName: 'send',
      onPress: () => navigation.navigate(SEND_TOKEN_FROM_HOME_FLOW),
      disabled: !isSendEnabled,
    },
    {
      title: t('connect'),
      iconName: 'wallet-connect',
      onPress: () => navigation.navigate(CONNECT_FLOW),
    },
  ];

  return <FloatingButtons items={items} />;
}

const useEnabledActions = () => {
  const totalBalance = useRootSelector(totalBalanceSelector);
  const smartWalletState = useSmartWalletStatus();

  const isEnabled = totalBalance.gt(0) && isEmpty(smartWalletState.sendingBlockedMessage);

  return {
    isSendEnabled: isEnabled,
    isExchangeEnabled: isEnabled,
  };
};

export default FloatingActions;
