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
import React from 'react';
import { Platform, Alert, Linking } from 'react-native';
import { useDispatch } from 'react-redux';
import t from 'translations/translate';
import * as Keychain from 'react-native-keychain';
import { PERMISSIONS, RESULTS, request as requestPermission } from 'react-native-permissions';
import type { NavigationScreenProp } from 'react-navigation';

// Selectors
import { useRootSelector } from 'selectors';

// Utils
import { getSupportedBiometryType } from 'utils/keychain';

// Constants
import { SET_FETCHING } from 'constants/onboardingConstants';
import { HOME } from 'constants/navigationConstants';

// Actions
import { walletSetupAction } from 'actions/onboardingActions';
import { logEventAction } from 'actions/analyticsActions';

// Components
import Toast from 'components/Toast';

const isiOS = Platform.OS === 'ios' ? true : false;

const showFaceIDFailed = () => {
  Toast.show({
    message: t('toast.failedToGetFaceIDPermission'),
    emoji: 'pensive',
    supportLink: true,
    link: t('label.faceIDSettings'),
    onLinkPress: () => {
      Linking.openURL('app-settings:');
    },
    autoClose: true,
  });
};

export function useBioMetricsPopup(navigation: NavigationScreenProp<any>) {
  const dispatch = useDispatch();
  const wallet = useRootSelector((root) => root.wallet.data);

  const proceedToBeginOnboarding = async (setBiometrics?: boolean) => {
    if (setBiometrics) dispatch(logEventAction(isiOS ? 'enable_face_id' : 'enable_biometric_id'));
    else dispatch(logEventAction(isiOS ? 'cancel_face_id' : 'cancel_biometric_id'));

    dispatch(walletSetupAction(setBiometrics));
    navigation.navigate(HOME);
  };

  const faceIDPermission = (biometryType) => {
    if (isiOS && biometryType === Keychain.BIOMETRY_TYPE.FACE_ID) {
      requestPermission(PERMISSIONS.IOS.FACE_ID)
        .then((status) => proceedToBeginOnboarding(status === RESULTS.GRANTED))
        .catch(showFaceIDFailed);
      return;
    }
    proceedToBeginOnboarding(true);
  };

  React.useEffect(() => {
    if (!wallet) {
      dispatch({ type: SET_FETCHING, payload: true });
      getSupportedBiometryType((biometryType) => {
        if (biometryType) {
          Alert.alert(t('biometricLogin.title', { biometryType: biometryType }), t('biometricLogin.description'), [
            { text: t('biometricLogin.button.cancel'), onPress: () => proceedToBeginOnboarding() },
            {
              text: t('biometricLogin.button.enable'),
              onPress: () => faceIDPermission(biometryType),
            },
          ]);
        } else {
          proceedToBeginOnboarding();
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return;
}
