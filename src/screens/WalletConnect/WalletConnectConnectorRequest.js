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

// Components
import Modal from 'components/Modal';

// Local
import WalletConnectRequestModal from './Requests/WalletConnectConnectorRequestModal';

function WalletConnectConnectorRequestScreen() {
  const navigation = useNavigation();
  const connector = navigation.getParam('connector');
  const chainId = navigation.getParam('chainId');
  const isV2WC = navigation.getParam('isV2');

  React.useLayoutEffect(() => {
    navigation.goBack(null);
    if (!connector) return;
    Modal.open(() => <WalletConnectRequestModal isV2WC={isV2WC} connector={connector} chainId={chainId} />);
  }, [connector, navigation, chainId, isV2WC]);

  return null;
}

export default WalletConnectConnectorRequestScreen;
