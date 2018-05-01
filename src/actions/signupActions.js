// @flow
import { NavigationActions } from 'react-navigation';
import { ONBOARDING_FLOW } from 'constants/navigationConstants';
import Storage from 'services/storage';

const storage = Storage.getInstance('db');

export const confirmOTPAction = (code: string) => {
  return async (dispatch: Function) => {
    // VALIDATE OTP
    if (code !== '1111') return;
    await storage.save('app_settings', { OTP: true });
    dispatch(NavigationActions.navigate({ routeName: ONBOARDING_FLOW }));
  };
};

// TODO: SEND OTP
