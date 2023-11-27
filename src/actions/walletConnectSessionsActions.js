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
import { getSdkError } from '@walletconnect/utils';

// actions
import { fetchV2ActiveSessionsAction } from 'actions/walletConnectActions';
import { logEventAction } from 'actions/analyticsActions';

// components
import Toast from 'components/Toast';

// constants
import {
  REMOVE_WALLETCONNECT_V2_SESSION,
  SET_IS_INITIALIZING_WALLETCONNECT_SESSIONS,
} from 'constants/walletConnectSessionsConstants';

// services
import { web3WalletInit } from 'services/walletConnect';

// utils
import { reportErrorLog } from 'utils/common';
import { hasKeyBasedWalletConnectSession } from 'utils/walletConnect';
import { isLogV2AppEvents } from 'utils/environment';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';

export const setIsCreatingWalletConnectSessionsAction = (isInitializing: boolean) => ({
  type: SET_IS_INITIALIZING_WALLETCONNECT_SESSIONS,
  payload: isInitializing,
});

export const initWalletConnectSessionsAction = (resetExisting: boolean = false) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      walletConnectSessions: { sessions, isInitializingSessions },
      wallet: { data: walletData },
      session: {
        data: { isOnline },
      },
    } = getState();

    if (!isOnline || isInitializingSessions) return;

    dispatch(setIsCreatingWalletConnectSessionsAction(true));

    // resets sessions for of old key based wallet implementation
    const keyBasedWalletAddress = walletData?.address;
    if (keyBasedWalletAddress && hasKeyBasedWalletConnectSession(sessions, keyBasedWalletAddress)) {
      dispatch(disconnectAllWalletConnectSessionsAction());
    }

    if (resetExisting) dispatch(fetchV2ActiveSessionsAction());

    dispatch(setIsCreatingWalletConnectSessionsAction(false));
  };
};

export const disconnectWalletConnectV2SessionByTopicAction = (topic: string, id?: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      walletConnectSessions: { v2Sessions },
    } = getState();

    const matchingSession = v2Sessions?.find((session) => session.topic === topic);
    if (!matchingSession) return;

    if (!id) {
      try {
        const web3wallet = await web3WalletInit();
        await web3wallet?.disconnectSession({
          topic,
          reason: getSdkError('USER_DISCONNECTED'),
        });
      } catch (error) {
        reportErrorLog('disconnectWalletConnectV2SessionByTopicAction -> disconnectSession failed ', {
          error,
          matchingSession,
        });
      }
    }

    dispatch(logEventAction('walletconnect_session_disconnected'));
    isLogV2AppEvents() && dispatch(logEventAction('v2_wallet_connect_dapp_disconnect'));
    dispatch({ type: REMOVE_WALLETCONNECT_V2_SESSION, payload: { topic } });
  };
};

const disconnectAllWalletConnectSessionsAction = () => {
  return (dispatch: Dispatch, getState: GetState) => {
    const {
      walletConnectSessions: { v2Sessions },
    } = getState();

    v2Sessions.forEach(({ topic }) => dispatch(disconnectWalletConnectV2SessionByTopicAction(topic)));

    Toast.show({
      message: t('toast.walletConnectConnectionsExpired'),
      emoji: 'eyes',
      supportLink: true,
      autoClose: false,
    });
  };
};
