// @flow
import { UPDATE_APP_SETTINGS } from 'constants/appSettingsConstants';
import Storage from 'services/storage';

const storage = Storage.getInstance('db');

export const saveBaseFiatCurrencyAction = (currency: string) => {
  return async (dispatch: Function) => {
    await storage.save('app_settings', { appSettings: { baseFiatCurrency: currency } });
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: {
        baseFiatCurrency: currency,
      },
    });
  };
};

export const changeRequestPinForTransactionAction = (value: boolean) => {
  return async (dispatch: Function) => {
    await storage.save('app_settings', { appSettings: { requestPinForTransaction: value } });
    dispatch({
      type: UPDATE_APP_SETTINGS,
      payload: {
        requestPinForTransaction: value,
      },
    });
  };
};
