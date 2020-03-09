// @flow

import t from 'tcomb-form-native';
import { isValidEmail, isValidName, isValidCityName, isValidPhone } from 'utils/validators';

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
  return isValidName(firstName) && firstName.length <= halfMaxLength;
});

const LastNameStructDef = t.refinement(t.String, (lastName: string = ''): boolean => {
  return isValidName(lastName) && lastName.length <= halfMaxLength;
});

const EmailStructDef = t.refinement(t.String, (email: string = ''): boolean => {
  return isValidEmail(email) && email.length <= maxLength;
});

const CityStructDef = t.refinement(t.String, (city: string = ''): boolean => {
  return isValidCityName(city) && city.length <= maxLength;
});

const PhoneStructDef = t.refinement(t.String, (phone: string = ''): boolean => {
  return isValidPhone(phone);
});

const CodeStructDef = t.refinement(t.String, (code: string = ''): boolean => {
  return !!code && !!code.length && isValidName(code);
});

FirstNameStructDef.getValidationErrorMessage = (firstName): string => {
  if (firstName && !isValidName(firstName)) {
    return 'Please enter a valid first name';
  } else if (firstName && firstName.length > halfMaxLength) {
    return `First name should not be longer than ${halfMaxLength} symbols`;
  }
  return '';
};

LastNameStructDef.getValidationErrorMessage = (lastName): string => {
  if (lastName && !isValidName(lastName)) {
    return 'Please enter a valid last name';
  } else if (lastName && lastName.length > halfMaxLength) {
    return `Last name should not be longer than ${halfMaxLength} symbols`;
  }
  return '';
};

EmailStructDef.getValidationErrorMessage = (email): string => {
  if (email && !isValidEmail(email)) {
    return 'Please enter a valid email';
  } else if (email && email.length > maxLength) {
    return `Email should not be longer than ${maxLength} symbols`;
  }
  return '';
};

CityStructDef.getValidationErrorMessage = (city): string => {
  if (city && !isValidCityName(city)) {
    return 'Please enter a valid city';
  } else if (city && city.length > maxLength) {
    return `City should not be longer than ${maxLength} symbols`;
  }
  return '';
};

PhoneStructDef.getValidationErrorMessage = (phone): string => {
  if (phone && !isValidPhone(phone)) {
    return 'Please enter a valid phone number with country code';
  }
  return '';
};

CodeStructDef.getValidationErrorMessage = (code): string => {
  if (code) {
    if (!isValidName(code)) {
      return 'Please enter a valid code';
    }
  }
  return 'Please enter your code';
};

export const Username = UsernameDef;
export const FirstNameStruct = FirstNameStructDef;
export const LastNameStruct = LastNameStructDef;
export const EmailStruct = EmailStructDef;
export const CityStruct = CityStructDef;
export const PhoneStruct = PhoneStructDef;
export const CodeStruct = CodeStructDef;
