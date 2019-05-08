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
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import type { SmartWalletUpgradeMessage } from 'models/SmartWalletUpgradeMessage';

export function getSmartWalletUpgradeMessageByStatus(status: ?string): SmartWalletUpgradeMessage {
  if (status === SMART_WALLET_UPGRADE_STATUSES.DEPLOYING) {
    // TODO: get average time
    return {
      title: 'Smart Wallet is being deployed now',
      message: 'You will be able to send assets once it\'s deployed.' +
        '\nCurrent average waiting time is 4 mins',
    };
  } else if (status === SMART_WALLET_UPGRADE_STATUSES.TRANSFERRING_ASSETS) {
    // TODO: get overall vs completed transfers count
    return {
      title: 'Assets are being transferred to Smart Wallet',
      message: 'You will be able to send assets once submitted transfer is complete.' +
        '\nCurrently 10 of 11 assets are transferred.',
    };
  }
  return {};
}
