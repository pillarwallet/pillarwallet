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
import styled from 'styled-components/native';
import { connect } from 'react-redux';
import t from 'translations/translate';

// actions
import { connectToWalletConnectConnectorAction } from 'actions/walletConnectActions';

// components
import CircleButton from 'components/CircleButton';
import Toast from 'components/Toast';
import QRCodeScanner from 'components/QRCodeScanner';
import Modal from 'components/Modal';

// utils
import { fontSizes } from 'utils/variables';
import { executeDeepLinkAction } from 'actions/deepLinkActions';

// hooks
import useWalletConnect from 'hooks/useWalletConnect';

// types
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';


type Props = {
  isOnline: boolean,
  executeDeepLink: (uri: string) => void,
};

const Container = styled.View`
  align-items: center;
  margin-top: 12px;
  margin-bottom: 36px;
`;

const validateQRCode = (uri: string): boolean => uri.startsWith('wc:') || uri.startsWith('pillarwallet:');

const WalletConnectQRCodeScanButton = ({
  isOnline,
  executeDeepLink,
}: Props) => {
  const { connectToConnector } = useWalletConnect();

  const openQRScanner = () => {
    if (!isOnline) {
      Toast.show({
        message: t('toast.userIsOffline'),
        emoji: 'satellite_antenna',
      });
      return;
    }
    Modal.open(() => (
      <QRCodeScanner
        validator={validateQRCode}
        onRead={handleQRRead}
      />
    ));
  };

  const handleQRRead = (uri: string) => {
    if (uri.startsWith('wc:')) {
      connectToConnector(uri);
    } else {
      executeDeepLink(uri);
    }
  };

  return (
    <Container>
      <CircleButton
        fontIcon="connect-active"
        fontIconStyle={{ fontSize: fontSizes.large }}
        label={t('button.connect')}
        onPress={openQRScanner}
      />
    </Container>
  );
};

const mapStateToProps = ({
  session: { data: { isOnline } },
}: RootReducerState): $Shape<Props> => ({
  isOnline,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  executeDeepLink: uri => dispatch(executeDeepLinkAction(uri)),
});

export default connect(mapStateToProps, mapDispatchToProps)(WalletConnectQRCodeScanButton);
