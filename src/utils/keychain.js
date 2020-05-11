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

const KEYCHAIN_SERVICE = 'com.pillarproject.wallet';
const KEYCHAIN_DATA_KEY = 'data';
const BIOMETRICS_PROMPT_MESSAGE = 'Continue';

export type KeyChainData = {
  privateKey?: string,
  mnemonic?: string,
};

export const resetKeychainDataObject = () => Keychain
  .resetGenericPassword({
    service: KEYCHAIN_SERVICE,
  })
  .catch(() => null);

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
  };

  const options = biometry ? { ...basicOptions, ...biometryOptions } : basicOptions;

  return Keychain.setGenericPassword(KEYCHAIN_DATA_KEY, JSON.stringify(data), options).catch(() => null);
};

export const getKeychainDataObject = (errorHandler?: Function) => Keychain
  .getGenericPassword({
    service: KEYCHAIN_SERVICE,
    authenticationPrompt: { title: BIOMETRICS_PROMPT_MESSAGE },
  })
  .then(({ password = '{}' }) => JSON.parse(password))
  .catch(errorHandler || (() => null));

export const getSupportedBiometryType = (resHandler: (biometryType?: string) => void, errorHandler?: Function) => {
  Keychain.getSupportedBiometryType().then(resHandler).catch(errorHandler || (() => null));
};

export const getPrivateKeyFromKeychainData = (data?: KeyChainData) => {
  if (!data || isEmpty(data) || !data.privateKey) return null;
  return get(data, 'privateKey', null);
};

export const shouldUpdateKeychainObject = (data: KeyChainData) => {
  return (!data || !data.privateKey || !Object.keys(data).includes('mnemonic'));
};
