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
import {
  ADD_USER_EVENT,
  USER_EVENT,
  PPN_INIT_EVENT,
  WALLET_CREATE_EVENT,
  WALLET_BACKUP_EVENT,
} from 'constants/userEventsConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// actions
import { saveDbAction } from 'actions/dbActions';

// utils
import { isNotKeyBasedType } from 'utils/accounts';

// types
import type SDKWrapper from 'services/api';
import type { Dispatch, GetState } from 'reducers/rootReducer';

export const addWalletCreationEventAction = (type: string, createdAt: number) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      userEvents: { data: userEvents },
    } = getState();

    let eventTitle;

    switch (type) {
      case ACCOUNT_TYPES.KEY_BASED:
        eventTitle = 'Wallet created';
        break;
      case ACCOUNT_TYPES.SMART_WALLET:
        eventTitle = 'Smart Wallet created';
        break;
      default:
        eventTitle = 'Unknown event';
    }

    const eventId = eventTitle.replace(/ /g, '');
    const walletCreateEvent = {
      id: eventId,
      eventTitle,
      createdAt,
      type: USER_EVENT,
      subType: WALLET_CREATE_EVENT,
    };

    dispatch({
      type: ADD_USER_EVENT,
      payload: walletCreateEvent,
    });

    let ppnCreateEvent;
    let updatedUserEvents = [];
    if (type === ACCOUNT_TYPES.SMART_WALLET) {
      ppnCreateEvent = {
        id: PPN_INIT_EVENT,
        eventTitle: 'Pillar Network',
        eventSubtitle: 'Enabled',
        createdAt: createdAt + 1, // to list it after smart wallet is created
        type: USER_EVENT,
        subType: PPN_INIT_EVENT,
      };

      dispatch({
        type: ADD_USER_EVENT,
        payload: ppnCreateEvent,
      });
      if (!userEvents.find(({ id }) => id === PPN_INIT_EVENT)) {
        updatedUserEvents.push(ppnCreateEvent);
      }
    }

    if (ppnCreateEvent) {
      updatedUserEvents =
        [...userEvents.filter(({ id }) => id !== eventId && id !== PPN_INIT_EVENT), walletCreateEvent, ppnCreateEvent];
    } else {
      updatedUserEvents = [...userEvents.filter(({ id }) => id !== eventId), walletCreateEvent];
    }

    await dispatch(saveDbAction('userEvents', { userEvents: updatedUserEvents }, true));
  };
};

export const getWalletsCreationEventsAction = () => {
  return async (dispatch: Dispatch, getState: GetState, api: SDKWrapper) => {
    const {
      user: { data: user },
    } = getState();

    const userAccounts = await api.listAccounts(user.walletId);
    if (!userAccounts.length) return;

    const walletCreatedEventsPromises = userAccounts
      .filter(isNotKeyBasedType)
      .map((acc) => dispatch(addWalletCreationEventAction(acc.type, new Date(acc.createdAt).getTime() / 1000)));

    await Promise.all(walletCreatedEventsPromises);
  };
};

export const addWalletBackupEventAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      userEvents: { data: userEvents },
    } = getState();

    const walletBackupEvent = {
      id: WALLET_BACKUP_EVENT,
      eventTitle: 'Key wallet',
      eventSubtitle: 'Backup secured',
      createdAt: +new Date() / 1000,
      type: USER_EVENT,
      subType: WALLET_BACKUP_EVENT,
    };
    dispatch({
      type: ADD_USER_EVENT,
      payload: walletBackupEvent,
    });
    const updatedUserEvents = [...userEvents, walletBackupEvent];
    await dispatch(saveDbAction('userEvents', { userEvents: updatedUserEvents }, true));
  };
};
