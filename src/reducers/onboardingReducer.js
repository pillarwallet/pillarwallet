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

// constants
import {
  RESET_ONBOARDING,
  SET_CHECKING_USERNAME,
  SET_FINISHING_ONBOARDING,
  SET_IMPORTING_WALLET,
  SET_ONBOARDING_ERROR,
  SET_ONBOARDING_PIN_CODE,
  SET_ONBOARDING_USER,
  SET_ONBOARDING_USERNAME_REGISTRATION_FAILED,
  SET_ONBOARDING_WALLET,
  SET_REGISTERING_USER,
  SET_TUTORIAL_DATA,
} from 'constants/onboardingConstants';

// types
import type { EthereumWallet } from 'models/Wallet';
import type { TutorialDataObject } from 'models/CMSData';
import type { OnboardingUser } from 'models/User';


export type OnboardingReducerState = {
  pinCode: ?string,
  wallet: ?EthereumWallet,
  user: ?OnboardingUser,
  errorMessage: ?string,
  isCheckingUsername: boolean,
  isImportingWallet: boolean,
  isRegisteringUser: boolean,
  usernameRegistrationFailed: boolean,
  isFinishingOnboarding: boolean,
  tutorialData: ?TutorialDataObject,
};

export type OnboardingReducerAction = {
  type: string,
  payload: any,
};

export const initialState = {
  pinCode: null,
  wallet: null,
  user: null,
  errorMessage: null,
  isCheckingUsername: false,
  isImportingWallet: false,
  isRegisteringUser: false,
  usernameRegistrationFailed: false,
  isFinishingOnboarding: false,
  tutorialData: null,
};

export default function onboardingReducer(
  state: OnboardingReducerState = initialState,
  action: OnboardingReducerAction,
): OnboardingReducerState {
  switch (action.type) {
    case SET_ONBOARDING_ERROR:
      return {
        ...state,
        isCheckingUsername: false,
        isImportingWallet: false,
        isRegisteringUser: false,
        isFinishingOnboarding: false,
        errorMessage: action.payload,
      };
    case SET_IMPORTING_WALLET:
      return {
        ...state,
        wallet: null,
        isImportingWallet: true,
      };
    case SET_ONBOARDING_WALLET:
      return {
        ...state,
        wallet: action.payload,
        isImportingWallet: false,
      };
    case SET_CHECKING_USERNAME:
      return {
        ...state,
        user: null,
        errorMessage: null,
        isCheckingUsername: action.payload !== undefined ? action.payload : true,
      };
    case SET_ONBOARDING_USER:
      return {
        ...state,
        user: action.payload,
        isCheckingUsername: false,
      };
    case SET_ONBOARDING_PIN_CODE:
      return {
        ...state,
        pinCode: action.payload,
      };
    case SET_REGISTERING_USER:
      return {
        ...state,
        isRegisteringUser: action.payload,
      };
    case SET_ONBOARDING_USERNAME_REGISTRATION_FAILED:
      return {
        ...state,
        usernameRegistrationFailed: action.payload,
      };
    case SET_FINISHING_ONBOARDING:
      return {
        ...state,
        isFinishingOnboarding: action.payload,
      };
    case SET_TUTORIAL_DATA:
      return {
        ...state,
        tutorialData: action.payload,
      };
    case RESET_ONBOARDING:
      return { ...initialState };
    default:
      return state;
  }
}
