// @flow

import t from 'tcomb-form-native';
import { isValidEmail, isValidPhoneWithoutCountryCode } from 'utils/validators';

export const MIN_USERNAME_LENGTH = 4;
export const MAX_USERNAME_LENGTH = 30;

const maxLength = 100;

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

const EmailStructDef = t.refinement(t.String, (email: string = ''): boolean => {
  return isValidEmail(email) && email.length <= maxLength;
});

const PhoneStructDef = t.refinement(t.Object, ({ input }): boolean => {
  return isValidPhoneWithoutCountryCode(input);
});

EmailStructDef.getValidationErrorMessage = (email): string => {
  if (email && !isValidEmail(email)) {
    return 'Please, check your email address. It may contain only latin letters (a-z), numbers (0-9) and dot (.)';
  } else if (email && email.length > maxLength) {
    return `Email should not be longer than ${maxLength} symbols`;
  }
  return '';
};

PhoneStructDef.getValidationErrorMessage = (phone): string => {
  if (phone && !isValidPhoneWithoutCountryCode(phone)) {
    return 'Please, check your phone number. It may contain only numbers (0-9).';
  }
  return '';
};

export const Username = UsernameDef;
export const EmailStruct = EmailStructDef;
export const PhoneStruct = PhoneStructDef;
