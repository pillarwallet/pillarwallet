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
import get from 'lodash.get';

// actions
import { addConnectedDeviceAction } from 'actions/connectedDevicesActions';

// constants
import { RECOVERY_PORTAL_SETUP_COMPLETE } from 'constants/navigationConstants';
import { DEVICE_CATEGORIES } from 'constants/connectedDevicesConstants';

// utils
import { addressesEqual } from 'utils/assets';

// services
import { navigate } from 'services/navigation';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';


export const addRecoveryPortalDeviceAction = (deviceAddress: string) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    await dispatch(addConnectedDeviceAction(DEVICE_CATEGORIES.SMART_WALLET_DEVICE, deviceAddress));
    const connectedDevices = get(getState(), 'connectedDevices.data', []);
    const isDeviceConnected = connectedDevices.some(({ address }) => addressesEqual(address, deviceAddress));
    if (!isDeviceConnected) return;
    // new device added, complete, otherwise submit button will be unblocked as addingDeviceAddress was reset
    navigate(NavigationActions.navigate({
      routeName: RECOVERY_PORTAL_SETUP_COMPLETE,
      params: {},
    }));
  };
};

