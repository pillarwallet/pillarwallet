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
import get from 'lodash.get';
import isEmpty from 'lodash.isempty';
import { getEnv } from 'configs/envConfig';

// constants
import { ETH } from 'constants/assetsConstants';

// components
import TextInput from 'components/TextInput';
import ItemSelector from 'components/ItemSelector';

// models
import type { TransactionFeeInfo } from 'models/Transaction';
import type { Balances } from 'models/Asset';
import type { FormSelector } from 'models/TextInput';

// utils
import { isValidNumber, parseNumber, reportOrWarn } from './common';
import { isFiatCurrency } from './exchange';
import { getBalance, calculateMaxAmount } from './assets';


export function makeAmountForm(
  maxAmount: number,
  minAmount: number,
  enoughForFee: boolean,
  formSubmitted: boolean,
  decimals: number,
  feeSymbol?: string,
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
      return `Not enough ${feeSymbol || ETH} to process the transaction fee`;
    } else if (amount >= maxAmount) {
      return 'Amount should not exceed the total balance';
    } else if (amount === 0) {
      /**
       * 0 is the first number that can be typed therefore we don't want
       * to show any error message on the input, however,
       * the form validation would still not go through,
       * but it's obvious that you cannot send 0 amount
       */
      return null;
    } else if (amount < minAmount) {
      return `Amount should be greater than ${minAmount} ${feeSymbol || ETH})`;
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


export function SelectorInputTemplate(locals: Object) {
  const {
    config: {
      label,
      customLabel,
      hasInput,
      placeholderSelector,
      placeholderInput,
      options,
      horizontalOptions = [],
      inputAddonText,
      inputRef,
      onSelectorOpen,
      horizontalOptionsTitle,
      optionsTitle,
      selectorModalTitle,
      inputWrapperStyle,
      rightLabel,
      onPressRightLabel,
      customInputHeight,
      inputHeaderStyle,
      noErrorText,
      renderOption,
      optionTabs,
    },
  } = locals;
  const value = get(locals, 'value', {});
  const { selector = {} } = value;
  const { iconUrl } = selector;
  const selectedOptionIcon = iconUrl ? `${getEnv('SDK_PROVIDER')}/${iconUrl}?size=3` : '';
  const selectorValue = {
    ...value,
    selector: { ...selector, icon: selectedOptionIcon },
  };
  const errorMessage = noErrorText ? '' : locals.error;
  const inputProps = {
    onChange: locals.onChange,
    onBlur: locals.onBlur,
    keyboardType: locals.keyboardType,
    autoCapitalize: locals.autoCapitalize,
    maxLength: 42,
    placeholderSelector,
    placeholder: placeholderInput,
    onSelectorOpen,
    selectorValue,
    label,
    customLabel,
    rightLabel,
    onPressRightLabel,
    inputHeaderStyle,
  };

  return (
    <TextInput
      style={{ width: '100%' }}
      hasError={!!locals.error}
      errorMessage={errorMessage}
      inputProps={inputProps}
      leftSideText={inputAddonText}
      numeric
      selectorOptions={{
        options,
        horizontalOptions,
        optionTabs,
        showOptionsTitles: !isEmpty(horizontalOptions),
        optionsTitle,
        horizontalOptionsTitle,
        fullWidth: !hasInput,
        selectorModalTitle: selectorModalTitle || label,
        selectorPlaceholder: placeholderSelector,
        optionsSearchPlaceholder: 'Asset search',
      }}
      getInputRef={inputRef}
      inputWrapperStyle={inputWrapperStyle}
      customInputHeight={customInputHeight}
      renderOption={renderOption}
    />
  );
}

export function ItemSelectorTemplate(locals: Object) {
  const {
    config: {
      label,
      optionsOpenText,
      placeholderSelector,
      options,
      horizontalOptions = [],
      onSelectorOpen,
      horizontalOptionsTitle,
      optionsTitle,
      selectorModalTitle,
      renderOption,
      optionTabs,
      activeTabOnItemClick,
      activeTabOnOptionOpenClick,
    },
  } = locals;

  const value = get(locals, 'value', {});
  const { selector = {} } = value;
  const { imageUrl } = selector;
  const selectorValue = {
    ...value,
    selector: { ...selector, icon: imageUrl },
  };
  const inputProps = {
    onChange: locals.onChange,
    label,
    placeholderSelector,
    onSelectorOpen,
    selectorValue,
    optionsOpenText,
  };

  return (
    <ItemSelector
      errorMessage={locals.error}
      inputProps={inputProps}
      selectorOptions={{
        options,
        horizontalOptions,
        optionTabs,
        showOptionsTitles: !isEmpty(horizontalOptions),
        optionsTitle,
        horizontalOptionsTitle,
        selectorModalTitle: selectorModalTitle || label,
        selectorPlaceholder: placeholderSelector,
        optionsSearchPlaceholder: 'Asset search',
      }}
      renderOption={renderOption}
      activeTabOnItemClick={activeTabOnItemClick}
      activeTabOnOptionOpenClick={activeTabOnOptionOpenClick}
    />
  );
}

const MIN_TX_AMOUNT = 0.000000000000000001;

export const selectorStructure = (
  balances: Balances, showErrorMessageWithBalance?: boolean, txFeeInfo: ?TransactionFeeInfo,
) => {
  let balance;
  let maxAmount;
  let amount;

  const Selector = t.refinement(t.Object, ({ selector, input, dontCheckBalance }) => {
    if (!selector
      || isEmpty(selector)
      || !input
      || !isValidNumber(input)) return false;

    const { symbol, decimals } = selector;

    if (isFiatCurrency(symbol) || dontCheckBalance) return true;

    amount = parseFloat(input);

    if (decimals === 0 && amount.toString().includes('.')) return false;

    balance = getBalance(balances, symbol);
    maxAmount = calculateMaxAmount(symbol, balance, txFeeInfo?.fee, txFeeInfo?.gasToken);

    return amount <= maxAmount && amount >= MIN_TX_AMOUNT;
  });

  Selector.getValidationErrorMessage = ({ selector, input }) => {
    if (!selector) {
      reportOrWarn('Wrong selector value', selector, 'critical');
      return true;
    }

    const { symbol, decimals } = selector;

    const isFiat = isFiatCurrency(symbol);

    if (!isValidNumber(input.toString())) {
      return 'Incorrect number entered';
    }

    const numericAmount = parseFloat(input || 0);

    if (numericAmount === 0) {
      /**
       * 0 is the first number that can be typed therefore we don't want
       * to show any error message on the input, however,
       * the form validation would still not go through,
       * but it's obvious that you cannot send 0 amount
       */
      return null;
    } else if (numericAmount < 0) {
      return 'Amount should be bigger than 0';
    }

    // all possible fiat validation is done
    if (isFiat) return true;

    // do not validate value if asset is not yet selected
    if (!symbol) {
      return false;
    }

    if (amount > maxAmount) {
      if (showErrorMessageWithBalance) {
        return `Amount should not be bigger than your balance - ${balance} ${symbol}.`;
      }
      return `Not enough ${symbol}`;
    } else if (amount < MIN_TX_AMOUNT) {
      return 'Amount should be greater than 1 Wei (0.000000000000000001 ETH)';
    } else if (decimals === 0 && amount.toString().includes('.')) {
      return 'Amount should not contain decimal places';
    }

    return true;
  };

  return Selector;
};


export const inputParser = (value: FormSelector) => {
  let formattedAmount = value.input;
  if (value.input) formattedAmount = value.input.toString().replace(/,/g, '.');
  return { ...value, input: formattedAmount };
};

export const inputFormatter = (value: FormSelector) => {
  let formattedAmount = value.input;
  if (value.input) formattedAmount = value.input.toString().replace(/,/g, '.');
  return { ...value, input: formattedAmount };
};
