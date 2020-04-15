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
import CircleButton from 'components/CircleButton';
import Toast from 'components/Toast';
import QRCodeScanner from 'components/QRCodeScanner';

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

type State = {
  isScanning: boolean,
};

const Container = styled.View`
  align-items: center;
  margin-top: -7px;
  margin-bottom: 36px;
`;

class QRCodeScanButton extends React.Component<Props, State> {
  state = {
    isScanning: false,
  };

  openQRScanner = () => {
    const { isOnline } = this.props;
    if (!isOnline) {
      Toast.show({
        message: 'Cannot use Connect while offline',
        type: 'warning',
        title: 'Warning',
      });
      return;
    }
    this.setState({ isScanning: true });
  };

  closeQRScanner = () => this.setState({
    isScanning: false,
  });

  validateQRCode = (uri: string): boolean => {
    return uri.startsWith('wc:') || uri.startsWith('pillarwallet:');
  };

  handleQRRead = (uri: string) => {
    const {
      requestWalletConnectSession,
      executeDeepLink,
    } = this.props;

    this.closeQRScanner();

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
    const { isScanning } = this.state;
    return (
      <Container>
        <CircleButton
          fontIcon="connect-active"
          fontIconStyle={{ fontSize: fontSizes.large }}
          label="Connect"
          onPress={this.openQRScanner}
        />
        <QRCodeScanner
          validator={this.validateQRCode}
          isActive={isScanning}
          onCancel={this.closeQRScanner}
          onRead={this.handleQRRead}
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
