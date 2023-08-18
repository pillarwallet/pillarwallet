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
import { Platform, Linking } from 'react-native';
import { useDispatch } from 'react-redux';
import * as Keychain from 'react-native-keychain';
import { PERMISSIONS, RESULTS, request as requestPermission } from 'react-native-permissions';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import Toast from 'components/Toast';

// Selectors
import { useBiometricsSelector } from 'selectors/appSettings';

// Actions
import { changeUseBiometricsAction } from 'actions/appSettingsActions';

// Utils
import { reportErrorLog } from 'utils/common';
import { getSupportedBiometryType } from 'utils/keychain';

// Types
import type { WalletObject } from 'models/Wallet';

// Local
import SettingsToggle from './SettingsToggle';

type Props = {
  wallet: ?WalletObject,
  pin: ?string,
};

function BiometricLoginSetting({ pin, wallet }: Props) {
  const { t, tRoot } = useTranslationWithPrefix('menu.settings');
  const dispatch = useDispatch();

  const supportedBiometryType = useSupportedBiometryType(wallet);
  const useBiometrics = useBiometricsSelector();

  const showFaceIdFailedMessage = () => {
    Toast.show({
      message: tRoot('toast.failedToGetFaceIDPermission'),
      emoji: 'pensive',
      supportLink: true,
      link: tRoot('label.faceIDSettings'),
      onLinkPress: () => {
        Linking.openURL('app-settings:');
      },
      autoClose: true,
    });
  };

  const handleBiometricPress = async () => {
    if (!pin || !wallet) return;

    const shouldRequestPermission =
      !useBiometrics && Platform.OS === 'ios' && supportedBiometryType === Keychain.BIOMETRY_TYPE.FACE_ID;
    if (!shouldRequestPermission) {
      dispatch(changeUseBiometricsAction(!useBiometrics, { ...wallet, pin }));
      return;
    }

    try {
      const status = await requestPermission(PERMISSIONS.IOS.FACE_ID);
      if (status !== RESULTS.GRANTED) {
        showFaceIdFailedMessage();
        return;
      }

      dispatch(changeUseBiometricsAction(!useBiometrics, { ...wallet, pin }));
    } catch (error) {
      reportErrorLog('error while requesting FACE_ID permission', error);
      showFaceIdFailedMessage();
    }
  };

  const showBiometricSetting = !!supportedBiometryType;

  if (!showBiometricSetting || !wallet || !pin) return null;

  return (
    <SettingsToggle
      icon="biometrics16"
      title={t('biometricLogin')}
      value={!!useBiometrics}
      onChangeValue={handleBiometricPress}
      testID={`${TAG}-button-toggle`}
      // eslint-disable-next-line i18next/no-literal-string
      accessibilityLabel={`${TAG}-button-toggle`}
    />
  );
}

export default BiometricLoginSetting;

function useSupportedBiometryType(wallet) {
  const [supportedBiometryType, setSupportedBiometryType] = React.useState(null);

  React.useEffect(() => {
    if (!wallet) return;
    // returns null, if the device haven't enrolled into fingerprint/FaceId. Even though it has hardware for it
    // and getBiometryType has default string value
    getSupportedBiometryType((biometryType) => setSupportedBiometryType(biometryType));
  }, [wallet]);

  return supportedBiometryType;
}

const TAG = 'BiometricLoginSetting';
