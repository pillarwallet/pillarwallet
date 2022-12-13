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
import { isEmpty } from 'lodash';

// constants
import { SET_FETCHING_HOLDINGS, UPDATE_APP_HOLDINGS } from 'constants/appsHoldingsConstants';

// services
import etherspotService from 'services/etherspot';

// utils
import { findFirstEtherspotAccount } from 'utils/accounts';
import { getSupportedChains } from 'utils/chains';
import { reportErrorLog } from 'utils/common';

// models, types
import type { Dispatch, GetState } from 'reducers/rootReducer';

// actions
import { saveDbAction } from './dbActions';

export const setIsFetchingHoldingsAction = (isFetching: boolean) => ({
  type: SET_FETCHING_HOLDINGS,
  payload: isFetching,
});

export const updateAppsHoldingsAction = (appsHoldingsData) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    if (isEmpty(appsHoldingsData)) return;

    dispatch({ type: UPDATE_APP_HOLDINGS, payload: appsHoldingsData });

    const updatedAppsHoldings = getState().appsHoldings.data;
    await dispatch(saveDbAction('appsHoldings', updatedAppsHoldings, true));
  };
};

export const fetchAppsHoldingsAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      appsHoldings: { isFetching },
      session: {
        data: { isOnline },
      },
      accounts: { data: accounts },
    } = getState();

    const etherspotAccount = findFirstEtherspotAccount(accounts);

    const chains = getSupportedChains(etherspotAccount);

    if (isFetching || !isOnline) return;

    dispatch(setIsFetchingHoldingsAction(true));

    const getChainInvestments = chains.map((chain) =>
      etherspotService.getAccountInvestments(chain, etherspotAccount.address),
    );

    try {
      const accountsInvestments = await Promise.all(getChainInvestments);

      if (!accountsInvestments?.[0]) return;

      const totalAppHoldings = [];
      accountsInvestments.forEach((investments) => {
        const items = investments.items;
        totalAppHoldings.push(...items);
      });

      await dispatch(updateAppsHoldingsAction(totalAppHoldings));
    } catch (e) {
      reportErrorLog('fetchAppsHoldingsAction failed', { e });
    }

    dispatch(setIsFetchingHoldingsAction(false));
  };
};
