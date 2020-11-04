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
import { UPDATE_SESSION } from 'constants/sessionConstants';
import merge from 'lodash.merge';

import type { SessionData } from 'models/Session';

export type SessionReducerState = {|
  data: SessionData,
|};

export type SessionReducerAction = {|
  type: string,
  payload: $Shape<SessionData>,
|};

export const initialState = {
  data: {
    isOnline: true,
    fcmToken: null,
    isAuthorizing: false,
    translationsInitialised: false,
    fallbackLanguageVersion: null,
    sessionLanguageCode: null, // setting here to not persist supported user's device language
    // (as it might change and app should reflect that)
    // and changes on device should not be treated as changes on App Settings
    sessionLanguageVersion: null,
  },
};

const appSettingsReducer = (
  state: SessionReducerState = initialState,
  action: SessionReducerAction,
): SessionReducerState => {
  switch (action.type) {
    case UPDATE_SESSION:
      return merge(
        {},
        state,
        { data: action.payload },
      );
    default:
      return state;
  }
};

export default appSettingsReducer;
