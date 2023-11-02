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
import { useNavigation, useRoute } from '@react-navigation/native';
import { useDispatch } from 'react-redux';

// Components
import Modal from 'components/Modal';

// Selector
import { useRootSelector } from 'selectors';

// Constant
import { VISIBLE_WC_MODAL } from 'constants/walletConnectConstants';

// Local
import WalletConnectRequestModal from './WalletConnectCallRequestModal';

/**
 * Pseudo-screen to support showing modal using navigation infrastructure.
 * Used primarily because of code delaying deep links after logging in.
 */
function WalletConnectCallRequestScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const route = useRoute();

  const { isVisibleModal } = useRootSelector((root) => root.walletConnect);

  const request = route?.params?.callRequest;

  React.useEffect(() => {
    navigation.goBack(null);

    if (!request) return;

    Modal.open(() => <WalletConnectRequestModal request={request} />);

    if (!isVisibleModal) return;
    const timeout = setTimeout(() => {
      dispatch({ type: VISIBLE_WC_MODAL, payload: false });
    }, 10000);
    // eslint-disable-next-line consistent-return
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request, navigation]);

  return null;
}

export default WalletConnectCallRequestScreen;
