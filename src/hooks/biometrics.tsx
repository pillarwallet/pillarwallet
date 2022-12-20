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
import { Platform, Alert } from 'react-native';
import { useDispatch } from 'react-redux';
import t from 'translations/translate';

import { utils } from 'ethers';

// Constants
import { CHAIN } from 'constants/chainConstants';
import { USD } from 'constants/assetsConstants';

// Selectors
import { useFiatCurrency, useChainRates, useActiveAccount, useRootSelector, appsHoldingsSelector } from 'selectors';

// Utils
import { nativeAssetPerChain } from 'utils/chains';
import { isEtherspotAccount } from 'utils/accounts';
import { getSupportedBiometryType } from 'utils/keychain';

// Actions
import { walletSetupAction } from 'actions/onboardingActions';
import { logEventAction } from 'actions/analyticsActions';

// Type
import { AppHoldings } from '../models/Investment';
import BigNumber from 'bignumber.js';

export function useBioMetricsPopup() {
  const dispatch = useDispatch();
  const wallet = useRootSelector((root) => root.wallet.data);

  const proceedToBeginOnboarding = async (setBiometrics?: boolean) => {
    if (setBiometrics) dispatch(logEventAction(Platform.OS === 'ios' ? 'enable_face_id' : 'enable_biometric_id'));
    else dispatch(logEventAction(Platform.OS === 'ios' ? 'cancel_face_id' : 'cancel_biometric_id'));

    dispatch(walletSetupAction(setBiometrics));
  };

  React.useEffect(() => {
    setTimeout(() => {
      if (!wallet) {
        getSupportedBiometryType((biometryType) => {
          if (biometryType) {
            Alert.alert(t('biometricLogin.title', { biometryType: biometryType }), t('biometricLogin.description'), [
              { text: t('biometricLogin.button.cancel'), onPress: () => proceedToBeginOnboarding() },
              {
                text: t('biometricLogin.button.enable'),
                onPress: () => proceedToBeginOnboarding(true),
              },
            ]);
          } else {
            proceedToBeginOnboarding();
          }
        });
      }
    }, 1000);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return;
}
