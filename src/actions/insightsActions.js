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

import {
  DISMISS_SMART_WALLET_INSIGHT,
  DISMISS_PPN_INSIGHT,
} from 'constants/insightsConstants';
import { saveDbAction } from 'actions/dbActions';
import type { Dispatch } from 'reducers/rootReducer';

export const dismissSmartWalletInsightAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch(saveDbAction('insights', { insights: { SWInsightDismissed: true } }));
    dispatch({ type: DISMISS_SMART_WALLET_INSIGHT });
  };
};

export const dismissPPNInsightAction = () => {
  return async (dispatch: Dispatch) => {
    dispatch(saveDbAction('insights', { insights: { PPNInsightDismissed: true } }));
    dispatch({ type: DISMISS_PPN_INSIGHT });
  };
};

