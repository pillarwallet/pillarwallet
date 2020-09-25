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
import { PERMISSIONS, RESULTS, request as requestPermission } from 'react-native-permissions';
import t from 'translations/translate';
import { noop, reportLog } from 'utils/common';
import CameraView from 'components/QRCodeScanner/CameraView';
import NoPermissions from 'components/QRCodeScanner/NoPermissions';
import type { Barcode, Point, Size } from 'react-native-camera';
import Toast from 'components/Toast';
import Modal from 'components/Modal';

type BarcodeBounds = {
  size: Size,
  origin: Point,
};

type Props = {|
  onRead?: (code: string) => void,
  onCancel?: () => void,
  validator: (code: string) => boolean,
  dataFormatter: (code: string) => string,
  rectangleColor: string,
|};

type State = {
  isAuthorized: ?boolean,
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

  modalRef = React.createRef<Modal>();

  state = {
    isAuthorized: null, // pending
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

  componentDidMount() {
    this.askPermissions();
  }

  askPermissions = () => {
    requestPermission(Platform.select({
      android: PERMISSIONS.ANDROID.CAMERA,
      ios: PERMISSIONS.IOS.CAMERA,
    }))
      .then((status) => this.setState({ isAuthorized: status === RESULTS.GRANTED }))
      .catch(() => this.setState({ isAuthorized: false }));
  };

  getIOSCoordinates = (bounds: BarcodeBounds) => {
    const { origin: { x, y } = {} } = bounds;

    return { x: +x, y: +y };
  };

  isInsideScanArea = (bounds: BarcodeBounds) => {
    const { x, y } = this.getIOSCoordinates(bounds);

    const isInRecognitionArea =
      x > viewMinScanX + 20 && y > viewMinScanY && x < viewMinScanX + 100 && y < viewMinScanY + 100;

    return isInRecognitionArea;
  };

  close = () => {
    if (this.modalRef.current) {
      this.modalRef.current.close();
    }
  }

  handleQRRead = (barcode: Barcode): void => {
    if (this.state.isFinished) {
      return;
    }

    const { bounds, data: code } = barcode;
    const isIos = Platform.OS === 'ios';

    if (isIos && bounds && !this.isInsideScanArea(bounds)) {
      return;
    }

    if (typeof code !== 'string') {
      reportLog('Wrong data from QR scanner received', { data: code });
      return;
    }

    const { validator } = this.props;

    if (!validator(code)) {
      Toast.show({
        message: t('toast.incorrectQRCode'),
        emoji: 'hushed',
        supportLink: true,
        autoClose: true,
      });
      this.close();
      return;
    }

    Vibration.vibrate();
    this.setState({ code, isFinished: true }, this.close);
  };

  onModalClosed = () => {
    const { code } = this.state;
    const {
      onRead,
      onCancel,
      dataFormatter,
    } = this.props;

    if (code && onRead) onRead(dataFormatter(code));
    if (!code && onCancel) onCancel();
  };

  render() {
    const { rectangleColor } = this.props;
    const { isAuthorized, isFinished } = this.state;

    if (isAuthorized === null) return null; // permission request pending

    const isDenied = isAuthorized === false; // null is pending, boolean value is actual status
    const animationInTiming = 300;
    const animationOutTiming = isFinished ? 1 : 300;

    return (
      <Modal
        ref={this.modalRef}
        animationInTiming={animationInTiming}
        animationOutTiming={animationOutTiming}
        animationIn="fadeIn"
        animationOut="fadeOut"
        hideModalContentWhileAnimating
        style={{
          margin: 0,
          justifyContent: 'flex-start',
        }}
        onModalHide={this.onModalClosed}
      >
        {isDenied ? (
          <NoPermissions onClose={this.close} />
        ) : (
          <CameraView
            onQRRead={this.handleQRRead}
            onCancel={this.close}
            rectangleSize={rectangleSize}
            rectangleColor={rectangleColor}
          />
        )}
      </Modal>
    );
  }
}
