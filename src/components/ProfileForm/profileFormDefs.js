// @flow

import t from 'tcomb-form-native';
import { isValidEmail, isValidName, isValidCityName } from 'utils/validators';

export const MIN_USERNAME_LENGTH = 4;
export const MAX_USERNAME_LENGTH = 30;

const maxLength = 100;
const halfMaxLength = maxLength / 2;

const usernameRegex = /^[a-z]+([a-z0-9-]+[a-z0-9])?$/i;
const startsWithNumberRegex = /^[0-9]/i;
const startsOrEndsWithDash = /(^-|-$)/i;
const UsernameDef = t.refinement(t.String, (username): boolean => {
  return username !== null
    && username.length >= MIN_USERNAME_LENGTH
    && username.length <= MAX_USERNAME_LENGTH
    && usernameRegex.test(username);
});

UsernameDef.getValidationErrorMessage = (username): string => {
  if (!usernameRegex.test(username)) {
    if (startsWithNumberRegex.test(username)) return 'Username can not start with a number';
    if (startsOrEndsWithDash.test(username)) return 'Username can not start or end with a dash';
    return 'Only use alpha-numeric characters or dashes.';
  }
  if (username.length < MIN_USERNAME_LENGTH) {
    return `Username should be longer than ${MIN_USERNAME_LENGTH - 1} characters.`;
  }
  if (username.length > MAX_USERNAME_LENGTH) {
    return `Username should be less than ${MAX_USERNAME_LENGTH + 1} characters.`;
  }

  return 'Please specify the username.';
};

const FirstNameStructDef = t.refinement(t.String, (firstName: string = ''): boolean => {
  return !!firstName && !!firstName.length && isValidName(firstName) && firstName.length <= halfMaxLength;
});

const LastNameStructDef = t.refinement(t.String, (lastName: string = ''): boolean => {
  return !!lastName && !!lastName.length && isValidName(lastName) && lastName.length <= halfMaxLength;
});

const EmailStructDef = t.refinement(t.String, (email: string = ''): boolean => {
  return !!email && !!email.length && isValidEmail(email) && email.length <= maxLength;
});

const CityStructDef = t.refinement(t.String, (city: string = ''): boolean => {
  return !!city && !!city.length && isValidCityName(city) && city.length <= maxLength;
});

FirstNameStructDef.getValidationErrorMessage = (firstName): string => {
  if (firstName) {
    if (!isValidName(firstName)) {
      return 'Please enter a valid first name';
    } else if (firstName.length > halfMaxLength) {
      return `First name should not be longer than ${halfMaxLength} symbols`;
    }
  }
  return 'Please specify your first name';
};

LastNameStructDef.getValidationErrorMessage = (lastName): string => {
  if (lastName) {
    if (!isValidName(lastName)) {
      return 'Please enter a valid last name';
    } else if (lastName.length > halfMaxLength) {
      return `Last name should not be longer than ${halfMaxLength} symbols`;
    }
  }
  return 'Please specify your last name';
};

EmailStructDef.getValidationErrorMessage = (email): string => {
  if (email) {
    if (!isValidEmail(email)) {
      return 'Please enter a valid email';
    } else if (email.length > maxLength) {
      return `Email should not be longer than ${maxLength} symbols`;
    }
  }
  return 'Please specify your email';
};

CityStructDef.getValidationErrorMessage = (city): string => {
  if (city) {
    if (!isValidCityName(city)) {
      return 'Please enter a valid city';
    } else if (city.length > maxLength) {
      return `City should not be longer than ${maxLength} symbols`;
    }
  }
  return 'Please specify your city';
};

export const Username = UsernameDef;
export const FirstNameStruct = FirstNameStructDef;
export const LastNameStruct = LastNameStructDef;
export const EmailStruct = EmailStructDef;
export const CityStruct = CityStructDef;
