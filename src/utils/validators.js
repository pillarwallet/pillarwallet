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

export function validBcxTransaction(transaction: ?Object): boolean {
  if (!transaction || !transaction.from || !transaction.to) return false;
  if (!transaction.status || !transaction.asset) return false;
  return true;
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
