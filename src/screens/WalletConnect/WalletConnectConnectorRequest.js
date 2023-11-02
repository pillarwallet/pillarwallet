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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';

// Components
import Modal from 'components/Modal';

// Selector
import { useRootSelector } from 'selectors';

// Constants
import { VISIBLE_WC_MODAL } from 'constants/walletConnectConstants';

// Local
import WalletConnectRequestModal from './Requests/WalletConnectConnectorRequestModal';

function WalletConnectConnectorRequestScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const dispatch = useDispatch();
  const connector = route?.params?.connector;
  const chainId = route?.params?.chainId;
  const isV2WC = route?.params?.isV2;

  const { isVisibleModal } = useRootSelector((root) => root.walletConnect);

  React.useLayoutEffect(() => {
    navigation.goBack(null);
    if (!connector) return;
    Modal.open(() => <WalletConnectRequestModal isV2WC={isV2WC} connector={connector} chainId={chainId} />);

    if (!isVisibleModal) return;
    const timeout = setTimeout(() => {
      dispatch({ type: VISIBLE_WC_MODAL, payload: false });
    }, 10000);
    // eslint-disable-next-line consistent-return
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connector, navigation, chainId, isV2WC]);

  return null;
}

export default WalletConnectConnectorRequestScreen;
