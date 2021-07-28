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
import t from 'translations/translate';

// constants
import {
  ADD_USER_EVENT,
  USER_EVENT,
  PPN_INIT_EVENT,
  WALLET_CREATE_EVENT,
  WALLET_BACKUP_EVENT,
  KEY_WALLET,
  PILLAR_NETWORK,
  LEGACY_SMART_WALLET_CREATED,
  ETHERSPOT_SMART_WALLET_CREATED,
} from 'constants/userEventsConstants';
import { ACCOUNT_TYPES } from 'constants/accountsConstants';
import { CHAIN } from 'constants/chainConstants';

// actions
import { saveDbAction } from 'actions/dbActions';

// utils
import {
  getSmartWalletAccountCreatedAtTimestamp,
  isAccountType,
  isArchanovaAccount,
  isEtherspotAccount,
  isNotKeyBasedType,
} from 'utils/accounts';
import { reportErrorLog } from 'utils/common';
import { getUserEventId } from 'utils/userEvents';
import { getSupportedChains } from 'utils/chains';

// selectors
import { accountsSelector } from 'selectors';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { Account } from 'models/Account';

export const addWalletCreationEventAction = (account: Account) => {
  return (dispatch: Dispatch, getState: GetState) => {
    const { userEvents: { data: userEvents } } = getState();

    // key based not supported
    if (isAccountType(account, ACCOUNT_TYPES.KEY_BASED)) return;

    // keep as it is to not break existing events
    const eventTitle = isEtherspotAccount(account)
      ? ETHERSPOT_SMART_WALLET_CREATED
      : LEGACY_SMART_WALLET_CREATED;
    const eventId = getUserEventId(eventTitle);
    const createdAtTimestamp = getSmartWalletAccountCreatedAtTimestamp(account);

    // this shouldn't happen
    if (!createdAtTimestamp) {
      reportErrorLog('addWalletCreationEventAction failed: no createdAtTimestamp', { account });
      return;
    }

    const accountCreatedAt = new Date(createdAtTimestamp / 1000);

    getSupportedChains(account).forEach((chain) => {
      const userChainEvents = userEvents?.[chain] ?? [];

      const walletCreatedMissing = !userChainEvents.some(({ id }) => id === eventId);
      if (!walletCreatedMissing) return;

      const walletCreatedEvent = {
        id: eventId,
        eventTitle,
        createdAt: accountCreatedAt,
        type: USER_EVENT,
        subType: WALLET_CREATE_EVENT,
      };

      dispatch({
        type: ADD_USER_EVENT,
        payload: { chain, userEvent: walletCreatedEvent },
      });
    });

    const ppnCreatedEventMissing = isArchanovaAccount(account)
      && !(userEvents.ethereum ?? []).some(({ id }) => id === PPN_INIT_EVENT);
    if (ppnCreatedEventMissing) {
      const ppnCreatedEvent = {
        id: PPN_INIT_EVENT,
        eventTitle: PILLAR_NETWORK,
        eventSubtitle: t('label.enabled'),
        createdAt: new Date(+accountCreatedAt + 1), // to list it after smart wallet is created
        type: USER_EVENT,
        subType: PPN_INIT_EVENT,
      };

      dispatch({ type: ADD_USER_EVENT, payload: { chain: CHAIN.ETHEREUM, userEvent: ppnCreatedEvent } });
    }

    const { userEvents: { data: updatedUserEvents } } = getState();
    dispatch(saveDbAction('userEvents', { userEvents: updatedUserEvents }, true));
  };
};

export const getWalletsCreationEventsAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    accountsSelector(getState())
      .filter(isNotKeyBasedType)
      .forEach((account) => dispatch(addWalletCreationEventAction(account)));
  };
};

export const addWalletBackupEventAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const walletBackupEvent = {
      id: WALLET_BACKUP_EVENT,
      eventTitle: KEY_WALLET,
      eventSubtitle: t('label.backedUp'),
      createdAt: +new Date() / 1000,
      type: USER_EVENT,
      subType: WALLET_BACKUP_EVENT,
    };

    Object.values(CHAIN).forEach((chain) => dispatch({
      type: ADD_USER_EVENT,
      payload: { chain, userEvent: walletBackupEvent },
    }));

    const updatedUserEvents = getState().userEvents.data;
    dispatch(saveDbAction('userEvents', { userEvents: updatedUserEvents }, true));
  };
};
