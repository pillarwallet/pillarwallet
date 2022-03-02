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
import { ADD_WALLET_EVENT } from 'constants/walletEventsConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { CHAIN } from 'constants/chainConstants';
import { EVENT_TYPE } from 'models/History';

// actions
import { saveDbAction } from 'actions/dbActions';

// utils
import {
  getAccountId,
  getSmartWalletAccountCreatedAtTimestamp,
  isAccountType,
  isArchanovaAccount,
} from 'utils/accounts';
import { logBreadcrumb } from 'utils/common';
import { getSupportedChains } from 'utils/chains';

// selectors
import { accountsSelector } from 'selectors';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { Account } from 'models/Account';


export const addWalletCreationEventIfNeededAction = (account: Account) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { walletEvents: { data: walletEvents } } = getState();

    // key based creation date not supported
    if (isAccountType(account, ACCOUNT_TYPES.KEY_BASED)) return;

    // keep as it is to not break existing events
    const createdAtTimestamp = getSmartWalletAccountCreatedAtTimestamp(account);
    if (!createdAtTimestamp) {
      // this shouldn't happen
      logBreadcrumb('addWalletCreationEventAction', 'failed: no createdAtTimestamp', { account });
      return;
    }

    const accountCreatedAt = new Date(createdAtTimestamp);

    const accountId = getAccountId(account);

    getSupportedChains(account).forEach((chain) => {
      const chainWalletEventsForAccount = walletEvents?.[accountId]?.[chain] ?? [];

      const isWalletCreatedEventMissing = !chainWalletEventsForAccount.some(({
        type,
      }) => type === EVENT_TYPE.WALLET_CREATED);
      if (!isWalletCreatedEventMissing) return;

      const walletCreatedEvent = {
        id: `${accountId}-${chain}-${EVENT_TYPE.WALLET_CREATED}`,
        type: EVENT_TYPE.WALLET_CREATED,
        date: accountCreatedAt,
      };

      dispatch({
        type: ADD_WALLET_EVENT,
        payload: { accountId, chain, walletEvent: walletCreatedEvent },
      });
    });

    const accountEthereumWalletEvents = walletEvents?.[accountId]?.ethereum ?? [];

    if (isArchanovaAccount(account)) {
      const isPpnCreatedEventMissing = !accountEthereumWalletEvents.some(({
        type,
      }) => type === EVENT_TYPE.PPN_INITIALIZED);
      if (isPpnCreatedEventMissing) {
        const ppnCreatedEvent = {
          id: `${accountId}-ethereum-${EVENT_TYPE.PPN_INITIALIZED}`,
          type: EVENT_TYPE.PPN_INITIALIZED,
          date: new Date(+accountCreatedAt + 1), // +1 to list it after smart wallet is created
        };

        dispatch({
          type: ADD_WALLET_EVENT,
          payload: { accountId, chain: CHAIN.ETHEREUM, walletEvent: ppnCreatedEvent },
        });
      }
    }

    const updatedWalletEvents = getState().walletEvents.data;
    dispatch(saveDbAction('walletEvents', { walletEvents: updatedWalletEvents }, true));
  };
};

export const addWalletBackupEventAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const accounts = accountsSelector(getState());

    accounts.forEach((account) => {
      const accountId = getAccountId(account);
      getSupportedChains(account).forEach((chain) => {
        const walletBackupEvent = {
          id: `${accountId}-${chain}-${EVENT_TYPE.WALLET_BACKED_UP}`,
          type: EVENT_TYPE.WALLET_BACKED_UP,
          date: new Date(),
        };

        dispatch({
          type: ADD_WALLET_EVENT,
          payload: { accountId: getAccountId(account), chain, walletEvent: walletBackupEvent },
        });
      });
    });

    const updatedWalletEvents = getState().walletEvents.data;
    dispatch(saveDbAction('walletEvents', { walletEvents: updatedWalletEvents }, true));
  };
};

export const addMissingWalletEventsIfNeededAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const accounts = accountsSelector(getState());
    accounts.forEach((account) => dispatch(addWalletCreationEventIfNeededAction(account)));
  };
};
