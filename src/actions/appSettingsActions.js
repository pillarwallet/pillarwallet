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
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import set from 'lodash.set';
import { saveDbAction } from './dbActions';

export const saveBaseFiatCurrencyAction = (currency: string) => {
  return (dispatch: Function) => {
    dispatch(saveDbAction('app_settings', { appSettings: { baseFiatCurrency: currency } }));
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: {
        baseFiatCurrency: currency,
      },
    });
  };
};

export const updateAppSettingsAction = (path: string, fieldValue: any) => {
  return (dispatch: Function) => {
    const settings = set({}, path, fieldValue);
    dispatch(saveDbAction('app_settings', { appSettings: settings }));
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: settings,
    });
  };
};

export const handleImagePickAction = (isPickingImage: boolean) => {
  return (dispatch: Function) => {
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: {
        isPickingImage,
      },
    });
  };
};

export const changeUseBiometricsAction = (value: boolean) => {
  return async (dispatch: Function) => {
    dispatch(saveDbAction('app_settings', { appSettings: { useBiometrics: value } }));
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: {
        useBiometrics: value,
      },
    });
  };
};
