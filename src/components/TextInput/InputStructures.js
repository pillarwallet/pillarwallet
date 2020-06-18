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

import t from 'tcomb-form-native';
import isEmpty from 'lodash.isempty';
import { isValidNumber } from 'utils/common';
import { isFiatCurrency } from 'utils/exchange';
import { getBalance } from 'utils/assets';
import { calculateMaxAmount } from 'screens/Exchange/utils';
import type { Balances } from 'models/Asset';


let balance;
let maxAmount;
let amount;
const MIN_TX_AMOUNT = 0.000000000000000001;

export const selectorStructure = (balances: Balances, showErrorMessageWithBalance?: boolean) => {
  const Selector = t.refinement(t.Object, ({ selector, input }) => {
    if (!selector
      || isEmpty(selector)
      || !input
      || !isValidNumber(input)) return false;

    const { symbol, decimals } = selector;

    if (isFiatCurrency(symbol)) return true;

    amount = parseFloat(input);

    if (decimals === 0 && amount.toString().includes('.')) return false;

    balance = getBalance(balances, symbol);
    maxAmount = calculateMaxAmount(symbol, balance);

    return amount <= maxAmount && amount >= MIN_TX_AMOUNT;
  });

  Selector.getValidationErrorMessage = ({ selector, input }) => {
    // if (!selector) {
    //   reportOrWarn('Wrong exchange selector value', selector, 'critical');
    //   return true;
    // }

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
