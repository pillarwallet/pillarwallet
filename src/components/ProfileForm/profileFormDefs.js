// @flow

import capitalize from 'lodash.capitalize';
import t from 'tcomb-form-native';
import {
  isValidEmail,
  isValidName,
  isValidCountryName,
  isValidCityName,
  isValidPhone,
} from 'utils/validators';

export const MIN_USERNAME_LENGTH = 4;
export const MAX_USERNAME_LENGTH = 30;

type Field = {
  name: string,
  type: string,
  label: string,
  config: Object,
}

const maxLength = 100;
const halfMaxLength = maxLength / 2;
const phoneMaxLength = 15;

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
  if (!username) return 'Please specify the username.';

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

const NameStructDef = t.refinement(t.String, (name: string = ''): boolean => {
  return !!name && !!name.length && isValidName(name) && name.length <= maxLength;
});

const FirstNameStructDef = t.refinement(t.String, (firstName: string = ''): boolean => {
  return !!firstName && !!firstName.length && isValidName(firstName) && firstName.length <= halfMaxLength;
});

const LastNameStructDef = t.refinement(t.String, (lastName: string = ''): boolean => {
  return !!lastName && !!lastName.length && isValidName(lastName) && lastName.length <= halfMaxLength;
});

const EmailStructDef = t.refinement(t.String, (email: string = ''): boolean => {
  return !!email && !!email.length && isValidEmail(email) && email.length <= maxLength;
});

const PhoneStructDef = t.refinement(t.String, (phone: string = ''): boolean => {
  return !!phone && !!phone.length && isValidEmail(phone) && phone.length <= phoneMaxLength;
});

const CountryStructDef = t.refinement(t.String, (country: string = ''): boolean => {
  return !!country && !!country.length && isValidCountryName(country) && country.length <= maxLength;
});

const CityStructDef = t.refinement(t.String, (city: string = ''): boolean => {
  return !!city && !!city.length && isValidCityName(city) && city.length <= maxLength;
});

function getValidationErrorMessageForName(name, nameDefForMessage) {
  if (name) {
    if (!isValidName(name)) {
      return `Please enter a valid ${nameDefForMessage}`;
    } else if (name.length > halfMaxLength) {
      return `${capitalize(nameDefForMessage)} should not be longer than ${halfMaxLength} symbols`;
    }
  }
  return `Please specify your ${nameDefForMessage}`;
}

NameStructDef.getValidationErrorMessage = (name): string =>
  getValidationErrorMessageForName(name, 'name');

FirstNameStructDef.getValidationErrorMessage = (firstName): string =>
  getValidationErrorMessageForName(firstName, 'first name');

LastNameStructDef.getValidationErrorMessage = (lastName): string =>
  getValidationErrorMessageForName(lastName, 'last name');

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

PhoneStructDef.getValidationErrorMessage = (phone): string => {
  if (phone) {
    if (!isValidPhone(phone)) {
      return 'Please enter a valid phone';
    } else if (phone.length > phoneMaxLength) {
      return `Phone should not be longer than ${phoneMaxLength} symbols`;
    }
  }

  return 'Please specify your phone';
};

CountryStructDef.getValidationErrorMessage = (country): string => {
  if (country) {
    if (!isValidCountryName(country)) {
      return 'Please enter a valid country';
    } else if (country.length > maxLength) {
      return `Country should not be longer than ${maxLength} symbols`;
    }
  }
  return 'Please specify your country';
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

export const getFormStructure = (fields: Field[], defaultTypes: Object) => {
  const fieldsStructure = fields.reduce((memo, field) => {
    memo[field.name] = defaultTypes[field.type];
    return memo;
  }, {});
  return t.struct(fieldsStructure);
};

export const UsernameStruct = UsernameDef;
export const NameStruct = NameStructDef;
export const FirstNameStruct = FirstNameStructDef;
export const LastNameStruct = LastNameStructDef;
export const EmailStruct = EmailStructDef;
export const PhoneStruct = PhoneStructDef;
export const CountryStruct = CountryStructDef;
export const CityStruct = CityStructDef;
