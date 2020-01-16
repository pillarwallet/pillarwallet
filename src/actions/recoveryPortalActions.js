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
import { NavigationActions } from 'react-navigation';
import { utils } from 'ethers';
import get from 'lodash.get';
import { BigNumber } from 'bignumber.js';

// actions
import { addAccountDeviceAction } from 'actions/smartWalletActions';
import { fetchGasInfoAction } from 'actions/historyActions';

// constants
import { RECOVERY_PORTAL_SETUP_COMPLETE } from 'constants/navigationConstants';

// components
import Toast from 'components/Toast';

// services
import smartWalletService from 'services/smartWallet';
import { navigate } from 'services/navigation';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';


export const addRecoveryPortalDeviceAction = (deviceAddress: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    await dispatch(addAccountDeviceAction(deviceAddress));
    await dispatch(fetchGasInfoAction());
    const gasInfo = get(getState(), 'history.gasInfo', {});
    const deployEstimateFee = await smartWalletService.estimateAccountDeviceDeployment(deviceAddress, gasInfo);
    const deployEstimateFeeBN = new BigNumber(utils.formatEther(deployEstimateFee.toString()));
    const etherBalanceBN = smartWalletService.getAccountRealBalance();
    if (etherBalanceBN.lt(deployEstimateFeeBN)) {
      Toast.show({
        message: 'Not enough ETH to connect device',
        type: 'warning',
        title: 'Unable to connect Recovery Portal device',
        autoClose: false,
      });
      return;
    }

    const accountDeviceDeploymentHash = await smartWalletService.deployAccountDevice(deviceAddress);
    if (!accountDeviceDeploymentHash) {
      Toast.show({
        message: 'Failed to make transaction',
        type: 'warning',
        title: 'Unable to connect Recovery Portal device',
        autoClose: false,
      });
      return;
    }

    navigate(NavigationActions.navigate({
      routeName: RECOVERY_PORTAL_SETUP_COMPLETE,
      params: { deviceAddress },
    }));
  };
};
