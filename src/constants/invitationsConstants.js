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

export const ADD_INVITATION = 'ADD_INVITATION';
export const UPDATE_INVITATIONS = 'UPDATE_INVITATIONS';
export const UPDATE_INVITATIONS_STATE = 'UPDATE_INVITATIONS_STATE';
export const TYPE_SENT = 'TYPE_SENT';
export const TYPE_INVITE = 'TYPE_INVITE';

// API values
export const TYPE_RECEIVED = 'connectionRequestedEvent';
export const TYPE_ACCEPTED = 'connectionAcceptedEvent';
export const TYPE_BLOCKED = 'connectionBlockedEvent';
export const TYPE_CANCELLED = 'connectionCancelledEvent';
export const TYPE_REJECTED = 'connectionRejectedEvent';
export const TYPE_DISCONNECTED = 'connectionDisconnectedEvent';

// MESSAGE values
export const MESSAGE_CANCELLED = 'Cancelled your connection';
export const MESSAGE_BLOCKED = 'Blocked your connection';
export const MESSAGE_REJECTED = 'Rejected your connection';
export const MESSAGE_DISCONNECTED = 'Disconnected your connection';
export const MESSAGE_ACCEPTED = 'Accepted your connection request';
export const MESSAGE_REQUEST = 'Connection request';
