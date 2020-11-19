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
export const SET_RARI_FUND_BALANCE = 'SET_RARI_FUND_BALANCE';
export const SET_RARI_APY = 'SET_RARI_APY';
export const SET_RARI_USER_DATA = 'SET_RARI_USER_DATA';
export const SET_FETCHING_RARI_FUND_BALANCE = 'SET_FETCHING_RARI_FUND_BALANCE';
export const SET_FETCHING_RARI_APY = 'SET_FETCHING_RARI_APY';
export const SET_FETCHING_RARI_USER_DATA = 'SET_FETCHING_RARI_USER_DATA';

export const RARI_POOLS = {
  STABLE_POOL: ('STABLE_POOL': 'STABLE_POOL'),
  YIELD_POOL: ('YIELD_POOL': 'YIELD_POOL'),
  ETH_POOL: ('ETH_POOL': 'ETH_POOL'),
};

export const RARI_POOLS_ARRAY: $Values<typeof RARI_POOLS>[] = Object.keys(RARI_POOLS);

export const RARI_AAVE_ETH_RESERVE_ID =
  '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee0x24a42fd28c976a61df5d00d0599c34c4f90748c8';
