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
import {
  MAIN_NETWORK_PROVIDER,
  MAIN_BCX_URL,
  MAIN_SDK_PROVIDER,
  MAIN_NOTIFICATIONS_URL,
  MAIN_INVESTMENTS_URL,
  MAIN_COLLECTIBLES_NETWORK,
  MAIN_OPEN_SEA_URL,
  MAIN_EXCHANGE_URL,
  MAIN_TX_DETAILS_URL,

  TESTING_NETWORK_PROVIDER,
  TESTING_BCX_URL,
  TESTING_SDK_PROVIDER,
  TESTING_NOTIFICATIONS_URL,
  TESTING_INVESTMENTS_URL,
  TESTING_COLLECTIBLES_NETWORK,
  TESTING_OPEN_SEA_URL,
  TESTING_EXCHANGE_URL,
  TESTING_TX_DETAILS_URL,
} from 'react-native-dotenv';

export const SET_ETHEREUM_NETWORK = 'SET_ETHEREUM_NETWORK';

export const ETHEREUM_NETWORKS = [
  {
    id: MAIN_NETWORK_PROVIDER,
    title: 'Main ethereum network',

    txDetailsUrl: MAIN_TX_DETAILS_URL,
    sdkProvider: MAIN_SDK_PROVIDER,
    bcxUrl: MAIN_BCX_URL,
    notificationsUrl: MAIN_NOTIFICATIONS_URL,
    investmentsUrl: MAIN_INVESTMENTS_URL,
    collectiblesNetwork: MAIN_COLLECTIBLES_NETWORK,
    openSeaUrl: MAIN_OPEN_SEA_URL,
    exchangeUrl: MAIN_EXCHANGE_URL,
  },
  {
    id: TESTING_NETWORK_PROVIDER,
    title: `Testing network (${TESTING_NETWORK_PROVIDER})`,

    txDetailsUrl: TESTING_TX_DETAILS_URL,
    sdkProvider: TESTING_SDK_PROVIDER,
    bcxUrl: TESTING_BCX_URL,
    notificationsUrl: TESTING_NOTIFICATIONS_URL,
    investmentsUrl: TESTING_INVESTMENTS_URL,
    collectiblesNetwork: TESTING_COLLECTIBLES_NETWORK,
    openSeaUrl: TESTING_OPEN_SEA_URL,
    exchangeUrl: TESTING_EXCHANGE_URL,
  },
];
