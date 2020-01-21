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
import branch, { BranchEvent } from 'react-native-branch';

// constants
import { ADD_NOTIFICATION } from 'constants/notificationConstants';
import { getUserReferralLink } from 'services/branchIo';

export type ClaimTokenAction = {
  walletId: string,
  code: string,
}

let branchIoSubscription;

export const startReferralsListenerAction = () => {
  return async () => {
    if (branchIoSubscription) return;
    branch.skipCachedEvents();
    // branch.userCompletedAction()
    // const referralLink = await getUserReferralLink();
    // console.log('referralLink: ', referralLink);
    // console.log('getFirstReferringParams: ', await branch.getFirstReferringParams());
    // console.log('getLatestReferringParams: ', await branch.getLatestReferringParams());
    // const bucket = await branch.loadRewards();
    // console.log('loadRewards: ', bucket);
    // console.log('redeemRewards: ', await branch.redeemRewards(1));
    // await new BranchEvent(BranchEvent.SpendCredits, null, {
    //   customData: { eth_address: 'test' },
    // }).logEvent();
    branchIoSubscription = branch.subscribe(({ error, params }) => {
      console.log('error: ', error);
      console.log('params: ', params);
    });
  };
};

export const stopReferralsListenerAction = () => {
  return async () => {
    if (!branchIoSubscription) return;
    // per Branch.io docs – branch.subscribe returns a function that cancels subscription once called
    branchIoSubscription();
    branchIoSubscription = null;
  };
};

// TODO: old one?
export const claimTokensAction = (props: ClaimTokenAction, callback?: Function) => {
  return async (dispatch: Function, getState: Function, api: Object) => {
    const response = await api.claimTokens(props);
    const { responseStatus } = response;

    if (responseStatus === 200) {
      if (callback) callback({ error: false });
    } else {
      if (callback) callback({ error: true });
      dispatch({
        type: ADD_NOTIFICATION,
        payload: {
          message: 'Please try again later',
          title: 'We can\'t verify your code at this time',
          messageType: 'warning',
        },
      });
    }
  };
};
