// @flow
import { NavigationActions } from 'react-navigation';
import { ONBOARDING_FLOW } from 'constants/navigationConstants';
import Storage from 'services/storage';
import { navigate } from 'services/navigation';

const storage = Storage.getInstance('db');

export const confirmOTPAction = (code: string) => {
  return async () => {
    // VALIDATE OTP
    if (code !== '1111') return;
    await storage.save('app_settings', { OTP: +new Date() });
    navigate(NavigationActions.navigate({ routeName: ONBOARDING_FLOW }));
  };
};

// TODO: SEND OTP
