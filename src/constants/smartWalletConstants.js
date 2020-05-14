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
import get from 'lodash.get';
import { sdkConstants } from '@smartwallet/sdk';

export const RESET_SMART_WALLET = 'RESET_SMART_WALLET';
export const SET_SMART_WALLET_SDK_INIT = 'SET_SMART_WALLET_SDK_INIT';
export const SET_SMART_WALLET_ACCOUNTS = 'SET_SMART_WALLET_ACCOUNTS';
export const SET_SMART_WALLET_CONNECTED_ACCOUNT = 'SET_SMART_WALLET_CONNECTED_ACCOUNT';
export const SET_SMART_WALLET_ACCOUNT_ENS = 'SET_SMART_WALLET_ACCOUNT_ENS';
export const SET_SMART_WALLET_UPGRADE_STATUS = 'SET_SMART_WALLET_UPGRADE_STATUS';
export const SET_SMART_WALLET_DEPLOYMENT_DATA = 'SET_SMART_WALLET_DEPLOYMENT_DATA';
export const SET_SMART_WALLET_LAST_SYNCED_PAYMENT_ID = 'SET_SMART_WALLET_LAST_SYNCED_PAYMENT_ID';
export const SET_SMART_WALLET_LAST_SYNCED_TRANSACTION_ID = 'SET_SMART_WALLET_LAST_SYNCED_TRANSACTION_ID';
export const START_SMART_WALLET_DEPLOYMENT = 'START_SMART_WALLET_DEPLOYMENT';
export const RESET_SMART_WALLET_DEPLOYMENT = 'RESET_SMART_WALLET_DEPLOYMENT';
export const SMART_WALLET_UPGRADE_STATUSES = {
  ACCOUNT_CREATED: 'ACCOUNT_CREATED',
  DEPLOYMENT_COMPLETE: 'DEPLOYMENT_COMPLETE',
  DEPLOYING: 'DEPLOYING',
};
export const SMART_WALLET_DEPLOYMENT_ERRORS = {
  SDK_ERROR: 'SDK_ERROR',
  INSUFFICIENT_FUNDS: 'INSUFFICIENT_FUNDS',
};
export const PAYMENT_COMPLETED = get(sdkConstants, 'AccountPaymentStates.Completed', '');
export const PAYMENT_PROCESSED = get(sdkConstants, 'AccountPaymentStates.Processed', '');
export const SMART_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER = 'SMART_WALLET_SWITCH_TO_GAS_TOKEN_RELAYER';
export const SET_SMART_WALLET_ACCOUNT_GAS_TOKEN_SUPPORTED = 'SET_SMART_WALLET_ACCOUNT_GAS_TOKEN_SUPPORTED';
