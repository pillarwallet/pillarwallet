// @flow
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import Storage from 'services/storage';
import set from 'lodash.set';

const storage = Storage.getInstance('db');

export const saveBaseFiatCurrencyAction = (currency: string) => {
  return (dispatch: Function) => {
    storage.save('app_settings', { appSettings: { baseFiatCurrency: currency } });
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: {
        baseFiatCurrency: currency,
      },
    });
  };
};

export const changeRequestPinForTransactionAction = (value: boolean) => {
  return (dispatch: Function) => {
    storage.save('app_settings', { appSettings: { requestPinForTransaction: value } });
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: {
        requestPinForTransaction: value,
      },
    });
  };
};

export const updateAppSettingsAction = (path: string, fieldValue: any) => {
  return (dispatch: Function) => {
    const settings = set({}, path, fieldValue);
    storage.save('app_settings', { appSettings: settings });
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
