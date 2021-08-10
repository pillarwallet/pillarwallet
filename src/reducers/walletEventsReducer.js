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

// constants
import { SET_WALLET_EVENTS, ADD_WALLET_EVENT } from 'constants/walletEventsConstants';

// types
import type { AccountWalletEvents, WalletEvent } from 'models/History';


export type WalletEventsReducerState = {
  data: AccountWalletEvents,
}

export type AddWalletEventAction = {|
  type: typeof ADD_WALLET_EVENT,
  payload: { accountId: string, chain: string, walletEvent: WalletEvent },
|};

export type WalletEventsReducerAction = AddWalletEventAction;

const initialState = {
  data: {},
};

const addWalletEvent = (
  accountId: string,
  chain: string,
  walletEvents: AccountWalletEvents,
  newWalletEvent: WalletEvent,
): AccountWalletEvents => {
  const accountWalletEvents = walletEvents?.[accountId] ?? {};
  const accountChainWalletEvents = accountWalletEvents?.[chain] ?? [];

  return {
    ...walletEvents,
    [accountId]: {
      ...accountWalletEvents,
      [chain]: accountChainWalletEvents.filter(({ type }) => type !== newWalletEvent.type).concat(newWalletEvent),
    },
  };
};

export default function walletEventsReducer(
  state: WalletEventsReducerState = initialState,
  action: WalletEventsReducerAction,
) {
  switch (action.type) {
    case SET_WALLET_EVENTS:
      return { ...state, data: action.payload };
    case ADD_WALLET_EVENT:
      const { accountId, chain, walletEvent } = action.payload;
      return { ...state, data: addWalletEvent(accountId, chain, state.data, walletEvent) };
    default:
      return state;
  }
}
