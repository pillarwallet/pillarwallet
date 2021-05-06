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

import CircleButton from 'components/CircleButton';
import Toast from 'components/Toast';
import QRCodeScanner from 'components/QRCodeScanner';
import Modal from 'components/Modal';

import { fontSizes } from 'utils/variables';
import {
  requestSessionAction,
  cancelWaitingRequestAction,
} from 'actions/walletConnectActions';
import { executeDeepLinkAction } from 'actions/deepLinkActions';
import type { RootReducerState, Dispatch } from 'reducers/rootReducer';

type Props = {
  isOnline: boolean,
  requestWalletConnectSession: (uri: string) => void,
  executeDeepLink: (uri: string) => void,
  cancelWaitingRequest: () => void,
};

const Container = styled.View`
  align-items: center;
  margin-top: 12px;
  margin-bottom: 36px;
`;

class QRCodeScanButton extends React.Component<Props> {
  openQRScanner = () => {
    const { isOnline } = this.props;
    if (!isOnline) {
      Toast.show({
        message: t('toast.userIsOffline'),
        emoji: 'satellite_antenna',
      });
      return;
    }
    Modal.open(() => (
      <QRCodeScanner
        validator={this.validateQRCode}
        onRead={this.handleQRRead}
      />
    ));
  };

  validateQRCode = (uri: string): boolean => {
    return uri.startsWith('wc:') || uri.startsWith('pillarwallet:');
  };

  handleQRRead = (uri: string) => {
    const {
      requestWalletConnectSession,
      executeDeepLink,
    } = this.props;

    if (uri.startsWith('wc:')) {
      requestWalletConnectSession(uri);
    } else {
      executeDeepLink(uri);
    }
  };

  cancelWaiting = () => {
    this.props.cancelWaitingRequest();
  };

  render() {
    return (
      <Container>
        <CircleButton
          fontIcon="connect-active"
          fontIconStyle={{ fontSize: fontSizes.large }}
          label={t('button.connect')}
          onPress={this.openQRScanner}
        />
      </Container>
    );
  }
}

const mapStateToProps = ({
  session: { data: { isOnline } },
}: RootReducerState): $Shape<Props> => ({
  isOnline,
});

const mapDispatchToProps = (dispatch: Dispatch): $Shape<Props> => ({
  requestWalletConnectSession: uri => dispatch(requestSessionAction(uri)),
  executeDeepLink: uri => dispatch(executeDeepLinkAction(uri)),
  cancelWaitingRequest: () => dispatch(cancelWaitingRequestAction()),
});

export default connect(mapStateToProps, mapDispatchToProps)(QRCodeScanButton);
