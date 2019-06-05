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
import { utils } from 'ethers';

import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { TX_CONFIRMED_STATUS } from 'constants/historyConstants';
import smartWalletService from 'services/smartWallet';

import type { Accounts } from 'models/Account';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';

import { getActiveAccount } from './accounts';
import { formatAmount } from './common';

function getMessage(status: string, activeAccountType: string, smartWalletState: Object) {
  switch (status) {
    case SMART_WALLET_UPGRADE_STATUSES.ACCOUNT_CREATED:
      if (activeAccountType !== ACCOUNT_TYPES.SMART_WALLET) return {};
      const deployEstimate = smartWalletService.getDeployEstimate();
      const feeSmartContractDeployEth = formatAmount(utils.formatEther(deployEstimate));
      return {
        title: 'To send assets, deploy Smart Wallet first',
        message: `You will have to pay a small fee ~${feeSmartContractDeployEth} ETH`,
      };
    case SMART_WALLET_UPGRADE_STATUSES.DEPLOYING:
      if (activeAccountType !== ACCOUNT_TYPES.SMART_WALLET) return {};
      // TODO: get average time
      return {
        title: 'Smart Wallet is being deployed now',
        message: 'You will be able to send assets once it\'s deployed.' +
          '\nCurrent average waiting time is 4 mins',
      };
    case SMART_WALLET_UPGRADE_STATUSES.TRANSFERRING_ASSETS:
      if (activeAccountType === ACCOUNT_TYPES.SMART_WALLET) return {};
      const { upgrade: { transfer: { transactions } } } = smartWalletState;
      const total = transactions.length;
      const complete = transactions.filter(tx => tx.status === TX_CONFIRMED_STATUS).length;
      return {
        title: 'Assets are being transferred to Smart Wallet',
        message: 'You will be able to send assets once submitted transfer is complete.' +
          `\nCurrently ${complete} of ${total} assets are transferred.`,
      };
    default:
      return {};
  }
}

export function getSmartWalletStatus(accounts: Accounts, smartWalletState: Object): SmartWalletStatus {
  const account = accounts.find(acc => acc.type === ACCOUNT_TYPES.SMART_WALLET);
  const activeAccount = getActiveAccount(accounts) || {};
  const { upgrade: { status } } = smartWalletState;
  const sendingBlockedMessage = getMessage(status, activeAccount.type, smartWalletState);
  return {
    hasAccount: !!account,
    status,
    sendingBlockedMessage,
  };
}

export function isConnectedToSmartAccount(connectedAccountRecord: ?Object) {
  return connectedAccountRecord && Object.keys(connectedAccountRecord).length;
}
