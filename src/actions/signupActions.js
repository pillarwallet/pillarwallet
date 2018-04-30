// @flow
import ethers from 'ethers';
import { NavigationActions } from 'react-navigation';
import { ONBOARDING_FLOW } from 'constants/navigationConstants';

export const confirmOTPAction = (code: string) => {
  return async (dispatch: Function) => {
    // VALIDATE OTP
    if (code !== '1111') return;
    dispatch(NavigationActions.navigate({ routeName: ONBOARDING_FLOW }));
  };
};

// TODO: SEND OTP