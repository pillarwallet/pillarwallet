// @flow
import { NavigationActions } from 'react-navigation';
import { ONBOARDING_FLOW } from 'constants/navigationConstants';
import { navigate } from 'services/navigation';
import { saveDbAction } from './dbActions';

export const confirmOTPAction = (code: string) => {
  return async (dispatch: Function) => {
    // VALIDATE OTP
    if (code !== '1111') return;
    dispatch(saveDbAction('app_settings', { OTP: +new Date() }));
    navigate(NavigationActions.navigate({ routeName: ONBOARDING_FLOW }));
  };
};

// TODO: SEND OTP
