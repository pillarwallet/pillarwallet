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
import { utils } from 'ethers';
import addressValidation from 'wallet-address-validator';
import { DEFAULT_BTC_NETWORK } from 'constants/bitcoinConstants';
import { BTC, ETH } from 'constants/assetsConstants';
import { pipe, decodeBTCAddress, decodeETHAddress } from 'utils/common';

type AddressValidator = {
  validator: (address: string) => boolean,
  message: string,
};

export const validatePin = (pin: string, confirmationPin?: string): string => {
  if (pin.length !== 6) {
    return 'Invalid pin\'s length (should be 6 numbers)';
  } else if (!pin.match(/^\d+$/)) {
    return 'Pin could contain numbers only';
  } else if (confirmationPin && pin !== confirmationPin) {
    return 'Pincode doesn\'t match the previous pin';
  }
  return '';
};

export const isValidBTCAddress = (address: string, network?: string): boolean => {
  const useNetwork = network || DEFAULT_BTC_NETWORK;

  switch (useNetwork) {
    case 'bitcoin':
      return addressValidation.validate(address, 'bitcoin', 'prod');
    case 'testnet':
      return addressValidation.validate(address, 'bitcoin', 'testnet');
    default:
      return false;
  }
};

export const isValidETHAddress = (address: string): boolean => {
  let result = true;
  try {
    utils.getAddress(address);
  } catch (e) {
    result = false;
  }
  return result;
};

export const isValidAddress = (address: string): boolean => {
  return isValidETHAddress(address) || isValidBTCAddress(address);
};

export const supportedAddressValidator = (address: string): boolean => {
  if (pipe(decodeETHAddress, isValidETHAddress)(address)) {
    return true;
  }
  if (pipe(decodeBTCAddress, isValidBTCAddress)(address)) {
    return true;
  }
  return false;
};

export const addressValidator = (token: string): AddressValidator => {
  const validators = {
    [ETH]: {
      validator: isValidETHAddress,
      message: 'Invalid Ethereum address',
    },
    [BTC]: {
      validator: isValidBTCAddress,
      message: 'Invalid Bitcoin address',
    },
  };

  const validator = validators[token];
  if (validator) {
    return validator;
  }

  return {
    validator: isValidAddress,
    message: 'Invalid address',
  };
};

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
  // eslint-disable-next-line
  const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
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

export function isValidUKPhone(phone: string) {
  const re = /^(\+44\d{10}\b)/;
  return re.test(phone);
}
