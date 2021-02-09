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

import { createSelector } from 'reselect';

// constants
import {
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  PAYMENT_NETWORK_TX_SETTLEMENT,
} from 'constants/paymentNetworkConstants';

// utils
import { addressesEqual } from 'utils/assets';

// models, types
import type { Transaction } from 'models/Transaction';
import type { RootReducerState } from 'reducers/rootReducer';
import type { PaymentNetworkReducerState } from 'reducers/paymentNetworkReducer';

// selectors
import { activeAccountAddressSelector } from './selectors';
import { accountHistorySelector, smartAccountHistorySelector } from './history';


const ppnTrxTags = [
  PAYMENT_NETWORK_ACCOUNT_TOPUP,
  PAYMENT_NETWORK_ACCOUNT_WITHDRAWAL,
  PAYMENT_NETWORK_TX_SETTLEMENT,
];

export const availableStakeSelector = ({ paymentNetwork: { availableStake } }: {
  paymentNetwork: PaymentNetworkReducerState,
}) => availableStake;

export const PPNIncomingTransactionsSelector: ((state: RootReducerState) => Transaction[]) = createSelector(
  accountHistorySelector,
  activeAccountAddressSelector,
  (history: Transaction[], activeAccountAddress: string) => {
    return history.filter(({ isPPNTransaction, to }) => !!isPPNTransaction && addressesEqual(to, activeAccountAddress));
  },
);

export const PPNTransactionsSelector: ((state: RootReducerState) => Transaction[]) = createSelector(
  accountHistorySelector,
  (history: Transaction[]) => {
    return history.filter(({ isPPNTransaction, tag }) => !!isPPNTransaction || ppnTrxTags.includes(tag));
  },
);

export const combinedPPNTransactionsSelector: ((state: RootReducerState) => Transaction[]) = createSelector(
  smartAccountHistorySelector,
  (history: Transaction[]) => {
    return history.filter(({ isPPNTransaction, tag }) => !!isPPNTransaction || ppnTrxTags.includes(tag));
  },
);

export const isPPNActivatedSelector = createSelector(
  availableStakeSelector,
  PPNTransactionsSelector,
  (availableStake, ppnTransactions) => availableStake || ppnTransactions.length,
);
