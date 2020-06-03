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
export const WALLETCONNECT_INIT_SESSIONS = 'WALLETCONNECT_INIT_SESSIONS';

export const WALLETCONNECT_TIMEOUT = 1000 * 10;

export const WALLETCONNECT_CANCEL_REQUEST = 'WALLETCONNECT_CANCEL_REQUEST';
export const WALLETCONNECT_SESSION_RECEIVED = 'WALLETCONNECT_SESSION_RECEIVED';
export const WALLETCONNECT_SESSION_REQUEST = 'WALLETCONNECT_SESSION_REQUEST';
export const WALLETCONNECT_SESSION_APPROVED = 'WALLETCONNECT_SESSION_APPROVED';
export const WALLETCONNECT_SESSION_REJECTED = 'WALLETCONNECT_SESSION_REJECTED';
export const WALLETCONNECT_SESSION_DISCONNECTED = 'WALLETCONNECT_SESSION_DISCONNECTED';
export const WALLETCONNECT_SESSION_KILLED = 'WALLETCONNECT_SESSION_KILLED';
export const WALLETCONNECT_SESSIONS_KILLED = 'WALLETCONNECT_SESSIONS_KILLED';

export const WALLETCONNECT_ERROR = 'WALLETCONNECT_ERROR';

export const WALLETCONNECT_CALL_REQUEST = 'WALLETCONNECT_CALL_REQUEST';
export const WALLETCONNECT_CALL_APPROVED = 'WALLETCONNECT_CALL_APPROVED';
export const WALLETCONNECT_CALL_REJECTED = 'WALLETCONNECT_CALL_REJECTED';

export const SESSION_REQUEST_EVENT = 'session_request';
export const SESSION_UPDATE_EVENT = 'session_update';
export const CALL_REQUEST_EVENT = 'call_request';
export const CONNECT_EVENT = 'connect';
export const DISCONNECT_EVENT = 'disconnect';

export const SESSION_REQUEST_ERROR = 'SESSION_REQUEST_ERROR';
export const CALL_REQUEST_ERROR = 'CALL_REQUEST_ERROR';
export const DISCONNECT_ERROR = 'DISCONNECT_ERROR';
export const SESSION_KILLED_ERROR = 'SESSION_KILLED_ERROR';
export const SESSION_APPROVAL_ERROR = 'SESSION_APPROVAL_ERROR';
export const SESSION_REJECTION_ERROR = 'SESSION_REJECTION_ERROR';
export const WALLETCONNECT_INIT_ERROR = 'WALLETCONNECT_INIT_ERROR';
export const TOGGLE_WALLET_CONNECT_PROMO_CARD = 'TOGGLE_WALLET_CONNECT_PROMO_CARD';
