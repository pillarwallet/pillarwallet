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
import { Platform } from 'react-native';
import * as Keychain from 'react-native-keychain';
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import t from 'translations/translate';
import { getEnv } from 'configs/envConfig';

// constants
import { STAGING } from 'constants/envConstants';
import { CHAIN } from 'constants/chainConstants';

// services
import etherspotService from 'services/etherspot';
import { emailSupport } from 'services/emailSupport';

// utils
import { reportErrorLog } from 'utils/common';

const KEYCHAIN_SERVICE = `com.pillarproject.wallet${getEnv().BUILD_TYPE === STAGING ? '.staging' : ''}`;

const KEYCHAIN_DATA_KEY = 'data';
const ACTIVE_ACCOUNT = 'Active account';

export type KeyChainData = {
  privateKey?: ?string,
  mnemonic?: ?string,
  pin?: ?string,
};

export const handleCatch = (accountAddress: ?string, error: ?(any[])) => {
  const msg = error ? error.toString() : '';
  if (msg && !/cancel/gi.exec(msg)) {
    reportErrorLog('Exception caught on keychain: ', msg);
    const buttons = [];
    buttons.push({
      text: t('error.failedKeychain.cancelButtonText'),
      onPress: () => {},
    });
    accountAddress = accountAddress ?? etherspotService?.getAccountAddress(CHAIN.ETHEREUM);
    if (accountAddress) {
      buttons.push({
        text: t('error.failedKeychain.supportButtonText'),
        onPress: () => emailSupport([{ type: ACTIVE_ACCOUNT, id: accountAddress }]),
      });
    }
  }
};

export const resetKeychainDataObject = () =>
  Keychain.resetGenericPassword({
    service: KEYCHAIN_SERVICE,
  }).catch((error) => handleCatch(null, error));

export const setKeychainDataObject = async (data: KeyChainData, biometry?: ?boolean) => {
  await resetKeychainDataObject();

  const basicOptions = {
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED,
    service: KEYCHAIN_SERVICE,
  };

  const biometryOptions = {
    accessControl: Platform.select({
      ios: Keychain.ACCESS_CONTROL.BIOMETRY_ANY_OR_DEVICE_PASSCODE,
      android: Keychain.ACCESS_CONTROL.BIOMETRY_ANY,
    }),
    authenticationType: Platform.select({
      ios: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
      android: Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
    }),
  };

  const options = biometry ? { ...basicOptions, ...biometryOptions } : basicOptions;

  return Keychain.setGenericPassword(KEYCHAIN_DATA_KEY, JSON.stringify(data), options).catch((error) =>
    handleCatch(null, error),
  );
};

export const getKeychainDataObject = async (errorHandler?: Function): Promise<KeyChainData> => {
  const options = {
    service: KEYCHAIN_SERVICE,
    authenticationPrompt: {
      title: t('title.unlockWithBiometrics'),
      subtitle: '', // required as empty
      description: '', // required as empty
    },
    authenticationType: Platform.select({
      ios: Keychain.AUTHENTICATION_TYPE.BIOMETRICS,
      android: Keychain.AUTHENTICATION_TYPE.DEVICE_PASSCODE_OR_BIOMETRICS,
    }),
  };

  // Keep requesting authentication until it succeeds. Users cannot proceed otherwise.
  // Intentionally unlimited retries on both cancel and failure.
  const attempt = (): Promise<KeyChainData> =>
    Keychain.getGenericPassword(options)
      .then((res) => {
        const { password = '{}' } = res || {};
        return JSON.parse(password);
      })
      .catch((error) => {
        if (errorHandler) errorHandler(error);
        handleCatch(null, error);
        return attempt();
      });

  return attempt();
};

export const getSupportedBiometryType = (resHandler: (biometryType?: string) => void, errorHandler?: Function) => {
  Keychain.getSupportedBiometryType()
    .then(resHandler)
    .catch(errorHandler || ((error) => handleCatch(null, error)));
};

export const getPrivateKeyFromKeychainData = (data?: KeyChainData) => {
  if (!data || isEmpty(data) || !data.privateKey) return null;
  return get(data, 'privateKey', null);
};

export const shouldUpdateKeychainObject = (data: KeyChainData) => {
  return !data || !data.pin || !data.privateKey || !Object.keys(data).includes('mnemonic');
};
