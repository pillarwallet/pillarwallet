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
import { userHasSmartWallet } from 'utils/smartWallet';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

import type { Accounts } from 'models/Account';

describe('Smartwallet utils', () => {
  describe('userHasSmartWallet', () => {
    it('returns false when user does not have a smart wallet', () => {
      const accounts: Accounts = [
        {
          id: '',
          type: ACCOUNT_TYPES.KEY_BASED,
          walletId: '',
          isActive: true,
        },
      ];

      expect(userHasSmartWallet(accounts)).toBe(false);
    });

    it('returns true when user has a smart wallet', () => {
      const accounts: Accounts = [
        {
          id: '',
          type: ACCOUNT_TYPES.KEY_BASED,
          walletId: '',
          isActive: true,
        },
        {
          id: '',
          type: ACCOUNT_TYPES.SMART_WALLET,
          walletId: '',
          isActive: false,
        },
      ];

      expect(userHasSmartWallet(accounts)).toBe(true);
    });
  });
});
