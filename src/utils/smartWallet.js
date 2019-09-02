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
import { SMART_WALLET_DEPLOYMENT_ERRORS, SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { TX_CONFIRMED_STATUS } from 'constants/historyConstants';

import type { Accounts } from 'models/Account';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';
import type { SmartWalletReducerState } from 'reducers/smartWalletReducer';

import { getActiveAccount } from './accounts';

const getMessage = (
  status: ?string,
  isSmartWalletActive: boolean,
  smartWalletState: SmartWalletReducerState,
) => {
  switch (status) {
    case SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED:
      if (!isSmartWalletActive) return {};
      return {
        title: 'To send assets, deploy Smart Wallet first',
        message: 'You will have to pay a small fee',
      };
    case SMART_WALLET_UPGRADE_STATUSES.DEPLOYING:
      if (!isSmartWalletActive) return {};
      // TODO: get average time
      return {
        title: 'Smart Wallet is being deployed now',
        message: 'You will be able to send assets once it\'s deployed.' +
          '\nCurrent average waiting time is 4 mins',
      };
    case SMART_WALLET_UPGRADE_STATUSES.TRANSFERRING_ASSETS:
      const { upgrade: { transfer: { transactions } } } = smartWalletState;
      const total = transactions.length;
      const complete = transactions.filter(tx => tx.status === TX_CONFIRMED_STATUS).length;
      return {
        title: 'Assets are being transferred to Smart Wallet',
        message: 'You will be able to send assets once submitted transfer is complete' +
          `${isSmartWalletActive ? ' and Smart Wallet is deployed' : ''}.` +
          `\nCurrently ${complete} of ${total} assets are transferred.`,
      };
    default:
      return {};
  }
};

export const userHasSmartWallet = (accounts: Accounts = []): boolean => {
  return accounts.some(acc => acc.type === ACCOUNT_TYPES.SMART_WALLET);
};

export const getSmartWalletStatus = (
  accounts: Accounts,
  smartWalletState: SmartWalletReducerState,
): SmartWalletStatus => {
  const hasAccount = userHasSmartWallet(accounts);
  const activeAccount = getActiveAccount(accounts);
  const isSmartWalletActive = !!activeAccount && activeAccount.type === ACCOUNT_TYPES.SMART_WALLET;

  const { upgrade: { status } } = smartWalletState;
  const sendingBlockedMessage = getMessage(status, isSmartWalletActive, smartWalletState);
  return {
    hasAccount,
    status,
    sendingBlockedMessage,
  };
};

export function isConnectedToSmartAccount(connectedAccountRecord: ?Object) {
  return connectedAccountRecord && Object.keys(connectedAccountRecord).length;
}

export function getDeployErrorMessage(errorType: string) {
  return {
    title: 'Smart Wallet deployment failed',
    message: errorType === SMART_WALLET_DEPLOYMENT_ERRORS.INSUFFICIENT_FUNDS
      ? 'You need to top up your Smart Account first'
      : 'There was an error on our server. Please try to re-deploy the account by clicking the button bellow',
  };
}
