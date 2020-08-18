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

export const SET_ALTALIX_AVAILABILITY: 'SET_ALTALIX_AVAILABILITY' = 'SET_ALTALIX_AVAILABILITY';
export const ALTALIX_AVAILABLE_COUNTRIES = ['GB'];

export const SET_SENDWYRE_RATES: 'SET_SENDWYRE_RATES' = 'SET_SENDWYRE_RATES';
export const LOAD_SENDWYRE_COUNTRY_SUPPORT: 'LOAD_SENDWYRE_COUNTRY_SUPPORT' = 'LOAD_SENDWYRE_COUNTRY_SUPPORT';
export const SET_SENDWYRE_COUNTRY_SUPPORT: 'SET_SENDWYRE_COUNTRY_SUPPORT' = 'SET_SENDWYRE_COUNTRY_SUPPORT';
export const RESET_SENDWYRE_COUNTRY_SUPPORT: 'RESET_SENDWYRE_COUNTRY_SUPPORT' = 'RESET_SENDWYRE_COUNTRY_SUPPORT';

export const SENDWYRE_SUPPORT = {
  UNKNOWN: ('UNKNOWN': 'UNKNOWN'),
  LOADING: ('LOADING': 'LOADING'),
  SUPPORTED: ('SUPPORTED': 'SUPPORTED'),
  UNSUPPORTED: ('UNSUPPORTED': 'UNSUPPORTED'),
};
