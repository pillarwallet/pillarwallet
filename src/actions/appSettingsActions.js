// @flow
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
