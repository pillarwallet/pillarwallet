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

// Components
import Modal from 'components/Modal';

// Local
import WalletConnectRequestModal from './WalletConnectCallRequestModal';

/**
 * Pseudo-screen to support showing modal using navigation infrastructure.
 * Used primarily because of code delaying deep links after logging in.
 */
function WalletConnectCallRequestScreen() {
  const navigation = useNavigation();
  const request = navigation.getParam('callRequest');

  React.useLayoutEffect(() => {
    navigation.goBack(null);

    if (!request) return;
    Modal.open(() => <WalletConnectRequestModal request={request} />);
  }, [request, navigation]);

  return null;
}

export default WalletConnectCallRequestScreen;
