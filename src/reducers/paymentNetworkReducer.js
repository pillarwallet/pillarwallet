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
import type { P2PPaymentChannel } from 'etherspot';

// constants
import {
  UPDATE_PAYMENT_NETWORK_STAKED,
  RESET_PAYMENT_NETWORK,
  MARK_PLR_TANK_INITIALISED,
  SET_PAYMENT_CHANNELS,
} from 'constants/paymentNetworkConstants';


export type PaymentNetworkReducerState = {
  availableStake: number,
  paymentChannels: P2PPaymentChannel[],
  isTankInitialised: boolean,
};

export type PaymentNetworkAction = {
  type: string,
  payload: any,
};

export const initialState = {
  availableStake: 0,
  paymentChannels: [],
  isTankInitialised: false,
};

export default function paymentNetworkReducer(
  state: PaymentNetworkReducerState = initialState,
  action: PaymentNetworkAction,
): PaymentNetworkReducerState {
  switch (action.type) {
    case UPDATE_PAYMENT_NETWORK_STAKED:
      const availableStake = action.payload || initialState.availableStake;
      return { ...state, availableStake };
    case MARK_PLR_TANK_INITIALISED:
      return { ...state, isTankInitialised: true };
    case SET_PAYMENT_CHANNELS:
      return { ...state, paymentChannels: action.payload };
    case RESET_PAYMENT_NETWORK:
      return { ...initialState };
    default:
      return state;
  }
}
