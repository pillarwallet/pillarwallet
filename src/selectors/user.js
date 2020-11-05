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

import { createSelector } from 'reselect';
import querystring from 'querystring';

import type { RootReducerState } from 'reducers/rootReducer';
import type { User } from 'models/User';
import type { Selector } from 'selectors';

export const userSelector = ({ user: { data } }: RootReducerState): User => data;

export const usernameSelector: Selector<?string> =
  createSelector(userSelector, ({ username }: User): ?string => username);

const lastUserUpdateTimeSelector: Selector<void | number> =
  createSelector(userSelector, ({ lastUpdateTime }: User): void | number => lastUpdateTime);

const profileImageSelector: Selector<void | string> =
  createSelector(userSelector, ({ profileImage }: User): void | string => profileImage);

export const updatedProfileImageSelector: Selector<string | null> = createSelector(
  profileImageSelector,
  lastUserUpdateTimeSelector,
  (profileImage, lastUpdateTime = 0) => profileImage
    ? `${profileImage}?${querystring.stringify({ t: lastUpdateTime })}`
    : null,
);

export const walletIdSelector: Selector<void | string> =
  createSelector(userSelector, ({ walletId }: User): void | string => walletId);
