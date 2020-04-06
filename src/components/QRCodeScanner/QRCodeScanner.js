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
import { Vibration, Dimensions, Platform } from 'react-native';
import throttle from 'lodash.throttle';
import Modal from 'react-native-modal';
import Permissions from 'react-native-permissions';
import { noop, reportLog } from 'utils/common';
import { CameraView } from 'components/QRCodeScanner/CameraView';
import NoPermissions from 'components/QRCodeScanner/NoPermissions';

import type { Barcode, Point, Size } from 'react-native-camera';

const AUTHORIZED = 'AUTHORIZED';
const PENDING = 'PENDING';
const DENIED = 'DENIED';

type BarcodeBounds = {
  size: Size,
  origin: Point,
};

type Props = {
  onRead: (code: string) => void,
  onCancel: () => void,
  validator: (code: string) => boolean,
  dataFormatter: (code: string) => string,
  rectangleColor: string,
  isActive: boolean,
};

type State = {
  authorizationState: string,
  isFinished: boolean,
  code: ?string,
};

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const rectangleSize = 250;

const viewMinScanX = (screenWidth - rectangleSize) / 2;
const viewMinScanY = (screenHeight - rectangleSize) / 2;

export default class QRCodeScanner extends React.Component<Props, State> {
  static defaultProps = {
    rectangleColor: '#FFFFFF',
    onRead: noop,
    validator: () => true,
    dataFormatter: (x: any) => x,
  };

  state = {
    authorizationState: PENDING,
    isFinished: false,
    code: null,
  };

  constructor(props: Props) {
    super(props);

    this.handleQRRead = throttle(this.handleQRRead, 1000, {
      leading: true,
      trailing: false,
    });
  }

  shouldComponentUpdate(nextProps: Props): boolean {
    const { isFinished } = this.state;
    const { isActive } = this.props;
    const { isActive: nextActive } = nextProps;

    if (isFinished && isActive && !nextActive) {
      // Is deactivating a finished scanner, reset state
      this.setState({ isFinished: false, code: null });

      return false;
    }

    if (!isActive && nextProps.isActive) {
      // Is reactivating a scanner
      return true;
    }

    if (isFinished) {
      // Scan is finished, stop rendering
      return false;
    }

    return true;
  }

  componentDidUpdate() {
    const { isActive } = this.props;

    if (isActive && this.state.authorizationState === PENDING) {
      this.askPermissions();
    }
  }

  componentDidMount() {
    if (this.props.isActive) {
      this.askPermissions();
    }
  }

  async askPermissions() {
    const status = await Permissions.request('camera');
    const isAuthorized = status.toUpperCase() === AUTHORIZED;

    this.setState({
      authorizationState: isAuthorized ? AUTHORIZED : DENIED,
    });
  }

  getIOSCoordinates = (bounds: BarcodeBounds) => {
    const { origin: { x, y } = {} } = bounds;

    return { x: +x, y: +y };
  };

  isInsideScanArea = (bounds: BarcodeBounds) => {
    const { x, y } = this.getIOSCoordinates(bounds);

    const isInRecognitionArea =
      x > viewMinScanX + 20 && y > viewMinScanY && x < viewMinScanX + 100 && y < viewMinScanY + 100;

    return isInRecognitionArea;
  }

  handleQRRead = (barcode: Barcode): void => {
    if (this.state.isFinished) {
      return;
    }

    const { bounds, data: code } = barcode;
    const isIos = Platform.OS === 'ios';

    if (isIos && !this.isInsideScanArea(bounds)) {
      return;
    }

    if (typeof code !== 'string') {
      reportLog('Wrong data from QR scanner received', { data: code });
      return;
    }

    const { validator } = this.props;

    if (!validator(code)) {
      return;
    }

    Vibration.vibrate();
    this.setState({ code, isFinished: true });
  };

  onModalClosed = () => {
    const { code } = this.state;

    if (code) {
      this.props.onRead(this.props.dataFormatter(code));
    }
  }

  render() {
    const {
      isActive,
      rectangleColor,
      onCancel,
    } = this.props;
    const { authorizationState, isFinished } = this.state;

    if (authorizationState === PENDING) {
      return null;
    }

    const isDenied = authorizationState === DENIED;
    const animationInTiming = 300;
    const animationOutTiming = isFinished ? 1 : 300;

    return (
      <Modal
        isVisible={isActive && !isFinished}
        animationInTiming={animationInTiming}
        animationOutTiming={animationOutTiming}
        animationIn="fadeIn"
        animationOut="fadeOut"
        hideModalContentWhileAnimating
        onBackButtonPress={onCancel}
        style={{
          margin: 0,
          justifyContent: 'flex-start',
        }}
        onModalHide={this.onModalClosed}
      >
        {isDenied ? (
          <NoPermissions onClose={onCancel} />
        ) : (
          <CameraView
            onQRRead={this.handleQRRead}
            onCancel={onCancel}
            rectangleSize={rectangleSize}
            rectangleColor={rectangleColor}
          />
        )}
      </Modal>
    );
  }
}
