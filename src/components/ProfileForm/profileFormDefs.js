// @flow

import * as tForm from 'tcomb-form-native';
import { isValidEmail, isValidPhoneWithoutCountryCode } from 'utils/validators';
import t from 'translations/translate';
import type { TranslatedString } from 'models/Translations';

export const MIN_USERNAME_LENGTH = 4;
export const MAX_USERNAME_LENGTH = 30;

const maxLength = 100;

const usernameRegex = /^[a-z]+([a-z0-9-]+[a-z0-9])?$/i;
const startsWithNumberRegex = /^[0-9]/i;
const startsOrEndsWithDash = /(^-|-$)/i;
const UsernameDef = tForm.refinement(tForm.String, (username): boolean => {
  return username !== null
    && username.length >= MIN_USERNAME_LENGTH
    && username.length <= MAX_USERNAME_LENGTH
    && usernameRegex.test(username);
});

UsernameDef.getValidationErrorMessage = (username): TranslatedString => {
  if (!usernameRegex.test(username)) {
    if (startsWithNumberRegex.test(username)) return t('auth:error.invalidUsername.cantStartWithNumber');
    if (startsOrEndsWithDash.test(username)) return t('auth:error.invalidUsername.cantStartEndWithDash');
    return t('auth:error.invalidUsername.useAlphanumericSymbolsOnly');
  }
  if (username.length < MIN_USERNAME_LENGTH) {
    return t('auth:error.invalidUsername.tooShort', { requiredLength: MIN_USERNAME_LENGTH - 1 });
  }
  if (username.length > MAX_USERNAME_LENGTH) {
    return t('auth:error.invalidUsername.tooLong', { requiredLength: MAX_USERNAME_LENGTH + 1 });
  }

  return t('auth:error.missingData', { missingData: t('auth:formData.username') });
};

const EmailStructDef = tForm.refinement(tForm.String, (email: string = ''): boolean => {
  return isValidEmail(email) && email.length <= maxLength;
});

const PhoneStructDef = tForm.refinement(tForm.Object, ({ input }): boolean => {
  return isValidPhoneWithoutCountryCode(input);
});

EmailStructDef.getValidationErrorMessage = (email): string => {
  if (email && !isValidEmail(email)) {
    return t('auth:error.invalidEmailAddress.default');
  } else if (email && email.length > maxLength) {
    return t('auth:error.invalidEmailAddress.tooLong', { requiredLength: maxLength });
  }
  return '';
};

PhoneStructDef.getValidationErrorMessage = (phone): string => {
  if (phone && !isValidPhoneWithoutCountryCode(phone)) {
    return t('auth:error.invalidPhoneNumber.default');
  }
  return '';
};

export const Username = UsernameDef;
export const EmailStruct = EmailStructDef;
export const PhoneStruct = PhoneStructDef;
