// @flow
import { utils } from 'ethers';

export const validatePin = (pin: string, confirmationPin?: string): string => {
  if (pin.length !== 6) {
    return 'Invalid pin\'s length (should be 6 numbers)';
  } else if (!pin.match(/^\d+$/)) {
    return 'Pin could contain numbers only';
  } else if (confirmationPin && pin !== confirmationPin) {
    return 'Pincode doesn`t match the previous pin';
  }
  return '';
};

export function isValidETHAddress(address: string): boolean {
  let result = true;
  try {
    utils.getAddress(address);
  } catch (e) {
    result = false;
  }
  return result;
}

export function hasAllValues(object: ?Object) {
  // No param reassign makes eslint sad
  object = object || {}; // eslint-disable-line
  const keys = Object.keys(object);
  const values = Object.values(object).filter((value) => value !== undefined && value !== '');
  return keys.length === values.length;
}

export function isValidFullname(fullName: string): boolean {
  if (!fullName) return false;
  const hasMoreThanOnePart = fullName.includes(' ');
  if (!hasMoreThanOnePart) return false;
  return true;
}

export function isValidEmail(email: string) {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
}

export function isValidName(name: string) {
  const re = (
    /^[a-zA-ZàáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžÀÁÂÄÃÅĄĆČĖĘÈÉÊËÌÍÎÏĮŁŃÒÓÔÖÕØÙÚÛÜŲŪŸÝŻŹÑßÇŒÆČŠŽ∂ð ,.'-]+$/u
  );
  return re.test(name);
}

export function isValidCityName(cityName: string) {
  const re = /^([a-zA-Z\u0080-\u024F]+(?:. |-| |'))*[a-zA-Z\u0080-\u024F]*$/u;
  return re.test(cityName);
}
