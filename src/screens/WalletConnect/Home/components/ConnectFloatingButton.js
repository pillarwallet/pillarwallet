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
import { useTranslation } from 'translations/translate';

// Components
import FloatingButtons from 'components/FloatingButtons';
import Modal from 'components/Modal';
import QRCodeScanner from 'components/QRCodeScanner';
import Toast from 'components/Toast';

// Hooks
import useWalletConnect from 'hooks/useWalletConnect';

// Selectors
import { useRootSelector } from 'selectors';

function ConnectFloatingButton() {
  const { t } = useTranslation();

  const { connectToConnector } = useWalletConnect();

  const isOnline = useRootSelector(root => root.session.data.isOnline);

  const showScannerModal = () => {
    if (!isOnline) {
      Toast.show({
        message: t('toast.userIsOffline'),
        emoji: 'satellite_antenna',
      });
      return;
    }

    Modal.open(() => <QRCodeScanner validator={validateUri} onRead={handleUri} />);
  };

  const validateUri = (uri: string): boolean => {
    return uri.startsWith('wc:');
  };

  const handleUri = (uri: string) => {
    if (!uri.startsWith('wc:')) return;

    connectToConnector(uri);
  };

  const buttons = [
    {
      title: t('button.connect'),
      iconName: 'qrcode',
      onPress: showScannerModal,
    },
  ];

  return <FloatingButtons items={buttons} />;
}

export default ConnectFloatingButton;
