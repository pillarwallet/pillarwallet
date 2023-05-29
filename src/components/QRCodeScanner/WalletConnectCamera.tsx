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
import React, { useEffect, useState } from 'react';
import { Vibration, Dimensions, Platform, View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { PERMISSIONS, RESULTS, request as requestPermission } from 'react-native-permissions';
import t from 'translations/translate';

// Utils
import { noop, logBreadcrumb } from 'utils/common';
import { useThemeColors } from 'utils/themes';

// Components
import CameraView from 'components/QRCodeScanner/CameraView';
import NoPermissions from 'components/QRCodeScanner/NoPermissions';
import Toast from 'components/Toast';
import Icon from 'components/core/Icon';

// Type
import type { Barcode, Point, Size } from 'react-native-camera';

// Screen
import ConnectedAppsFloatingButton from 'screens/WalletConnect/Home/components/ConnectedAppsFloatingButton';
import { useDispatch } from 'react-redux';

type BarcodeBounds = {
  size: Size;
  origin: Point;
};

type Props = {
  onRead?: (code: string) => void;
  onCancel?: () => void;
  validator: (code: string) => boolean;
  dataFormatter: (code: string) => string;
  rectangleColor: string;
  onClose?: () => void;
  onNavigateWallet?: () => void;
  visibleCamera: boolean;
};

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const rectangleSize = 250;

const viewMinScanX = (screenWidth - rectangleSize) / 2;
const viewMinScanY = (screenHeight - rectangleSize) / 2;

const rectangleColor = '#FFFFFF';

export default function (props: Props) {
  const {
    visibleCamera,
    onClose,
    onRead = noop,
    dataFormatter = (x: any) => x,
    onCancel,
    onNavigateWallet,
    validator,
  } = props;
  const dispatch = useDispatch();

  const colors = useThemeColors();

  const [isAuthorized, setIsAuthorized] = useState(null);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    setIsFinished(false);
  }, []);

  useEffect(() => {
    setIsFinished(false);
    if (visibleCamera) askPermissions();
  }, [visibleCamera]);

  const askPermissions = () => {
    requestPermission(
      Platform.select({
        android: PERMISSIONS.ANDROID.CAMERA,
        ios: PERMISSIONS.IOS.CAMERA,
      }),
    )
      .then((status) => {
        if (status !== RESULTS.GRANTED)
          Alert.alert(t('paragraph.cameraPermission'), t('paragraph.needCameraPermission'));
        setIsAuthorized(status === RESULTS.GRANTED);
      })
      .catch(() => {
        Alert.alert(t('paragraph.cameraPermission'), t('paragraph.needCameraPermission'));
        setIsAuthorized(false);
      });
  };

  const close = () => {
    if (onClose) {
      onClose();
    }
  };

  const getIOSCoordinates = (bounds: BarcodeBounds) => {
    const { origin: { x, y } = {} } = bounds;

    return { x: +x, y: +y };
  };

  const isInsideScanArea = (bounds: BarcodeBounds) => {
    const { x, y } = getIOSCoordinates(bounds);

    const isInRecognitionArea =
      x > viewMinScanX + 20 && y > viewMinScanY && x < viewMinScanX + 100 && y < viewMinScanY + 100;

    return isInRecognitionArea;
  };

  const handleQRRead = async (barcode: Barcode): Promise<void> => {
    if (isFinished) {
      return;
    }

    const { bounds, data: code } = barcode;
    const isIos = Platform.OS === 'ios';

    if (isIos && bounds && !isInsideScanArea(bounds)) {
      return;
    }

    if (typeof code !== 'string') {
      logBreadcrumb('handleQRRead', 'Wrong data from QR scanner received', { data: code });
      return;
    }

    if (!validator(code)) {
      close();
      Toast.show({
        message: t('toast.incorrectQRCode'),
        emoji: 'hushed',
        supportLink: true,
        autoClose: true,
      });
      return;
    }

    Vibration.vibrate();
    handleResult(code);
    await setIsFinished(true);
  };

  const handleResult = (code) => {
    if (code && onRead) {
      onRead(dataFormatter(code));
      setIsFinished(false);
    }
    close();
    if (!code && onCancel) onCancel();
  };

  return (
    <View style={styles.container}>
      {isAuthorized === false && <NoPermissions onClose={close} />}

      {visibleCamera && isAuthorized && (
        <CameraView
          onQRRead={handleQRRead}
          onCancel={close}
          onNavigateWallet={onNavigateWallet}
          rectangleSize={rectangleSize}
          rectangleColor={rectangleColor}
        />
      )}

      {!!onNavigateWallet && (
        <View style={styles.bottomSubContent}>
          <TouchableOpacity
            style={[styles.walletButton, { backgroundColor: colors.basic050 }]}
            onPress={onNavigateWallet}
          >
            <Icon name="wallet-connect" />
          </TouchableOpacity>
        </View>
      )}

      {!!onNavigateWallet && <ConnectedAppsFloatingButton style={{ bottom: 55 }} isInCameraFloating />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bottomContent: {
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'space-around',
    flexDirection: 'row',
    width: '100%',
  },
  bottomSubContent: {
    width: '30%',
    position: 'absolute',
    bottom: 55,
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletButton: {
    padding: 12,
    borderRadius: 50,
  },
});
