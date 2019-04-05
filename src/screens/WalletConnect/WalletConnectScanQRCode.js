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
import { connect } from 'react-redux';
import { Keyboard } from 'react-native';
import { Container } from 'components/Layout';
import type { NavigationScreenProp } from 'react-navigation';
import QRCodeScanner from 'components/QRCodeScanner';
import { onWalletConnectSessionRequest } from 'actions/walletConnectActions';

type Props = {
  navigation: NavigationScreenProp<*>,
  onWalletConnectSessionRequest: Function,
};

type State = {
  isScanning: boolean,
};

class SendTokenContacts extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      isScanning: true,
    };
  }

  componentDidMount() {
    Keyboard.dismiss();
  }

  validateQRCode = (uri: string) => {
    if (uri.startsWith('wc:')) {
      return true;
    }
    return false;
  };

  handleQRScannerOpen = async () => {
    this.setState(
      {
        isScanning: !this.state.isScanning,
      },
      () => {
        if (this.state.isScanning) {
          Keyboard.dismiss();
        }
      },
    );
  };

  handleQRScannerClose = () => {
    this.setState({
      isScanning: false,
    });
  };

  handleQRRead = (uri: string) => {
    this.props.onWalletConnectSessionRequest(uri);
    this.setState({ isScanning: false }, () => {
      this.navigateBack();
    });
  };

  navigateBack = () => this.props.navigation.goBack(null);

  render() {
    const { isScanning } = this.state;

    return (
      <Container inset={{ bottom: 0 }}>
        <QRCodeScanner
          validator={this.validateQRCode}
          isActive={isScanning}
          onDismiss={this.handleQRScannerClose}
          onRead={this.handleQRRead}
        />
      </Container>
    );
  }
}

export default connect(
  null,
  { onWalletConnectSessionRequest },
)(SendTokenContacts);
