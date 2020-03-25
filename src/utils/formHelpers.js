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
import * as React from 'react';
import t from 'tcomb-form-native';
import TextInput from 'components/TextInput';
import { isValidNumber, parseNumber } from './common';

export function makeAmountForm(
  maxAmount: number,
  minAmount: number,
  enoughForFee: boolean,
  formSubmitted: boolean,
  decimals: number,
) {
  const Amount = t.refinement(t.String, (amount): boolean => {
    if (!isValidNumber(amount.toString())) return false;

    if (decimals === 0 && amount.toString().includes('.')) return false;

    amount = parseNumber(amount.toString());

    const isValid = enoughForFee
      && amount <= maxAmount
      && amount >= minAmount;

    if (formSubmitted) return isValid && amount > 0;
    return isValid;
  });

  Amount.getValidationErrorMessage = (amount): ?string => {
    if (!isValidNumber(amount.toString())) {
      return 'Incorrect number entered.';
    }

    amount = parseNumber(amount.toString());
    if (!enoughForFee) {
      return 'Not enough ETH to process the transaction fee';
    } else if (amount >= maxAmount) {
      return 'Amount should not exceed the sum of total balance and est. network fee';
    } else if (amount === 0) {
      /**
       * 0 is the first number that can be typed therefore we don't want
       * to show any error message on the input, however,
       * the form validation would still not go through,
       * but it's obvious that you cannot send 0 amount
       */
      return null;
    } else if (amount < minAmount) {
      return `Amount should be greater than ${minAmount} ETH)`;
    } else if (decimals === 0 && amount.toString().includes('.')) {
      return 'Amount should not contain decimal places';
    }
    return 'Amount should be specified.';
  };

  return t.struct({
    amount: Amount,
  });
}

function AmountInputTemplate(locals) {
  const { config: { icon, valueInFiatOutput, customProps = {} } } = locals;
  const errorMessage = locals.error;
  const inputProps = {
    autoFocus: true,
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    placeholder: '0',
    value: locals.value,
    ellipsizeMode: 'middle',
    keyboardType: 'decimal-pad',
    autoCapitalize: 'words',
  };

  return (
    <TextInput
      errorMessage={errorMessage}
      inputProps={inputProps}
      innerImageURI={icon}
      fallbackToGenericToken
      leftSideText={valueInFiatOutput}
      numeric
      errorMessageOnTop
      {...customProps}
    />
  );
}

export function getAmountFormFields(config: Object): Object {
  return {
    fields: {
      amount: {
        template: AmountInputTemplate,
        config,
        transformer: {
          parse: (str = '') => str.toString().replace(/,/g, '.'),
          format: (value = '') => value.toString().replace(/,/g, '.'),
        },
      },
    },
  };
}
