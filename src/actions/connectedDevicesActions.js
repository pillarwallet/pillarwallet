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
import get from 'lodash.get';
import { Alert } from 'react-native';
import { NavigationActions } from 'react-navigation';

// constants
import {
  SET_ADDING_CONNECTED_DEVICE_ADDRESS,
  DEVICE_CATEGORIES,
  SET_CONNECTED_DEVICES,
  RESET_ADDING_CONNECTED_DEVICE_ADDRESS,
  SET_REMOVING_CONNECTED_DEVICE_ADDRESS,
  RESET_REMOVING_CONNECTED_DEVICE_ADDRESS,
} from 'constants/connectedDevicesConstants';
import { REMOVE_SMART_WALLET_CONNECTED_DEVICE } from 'constants/navigationConstants';

// components
import Toast from 'components/Toast';

// utils
import { addressesEqual } from 'utils/assets';
import { isSmartWalletDeviceDeployed } from 'utils/smartWallet';

// services
import { navigate } from 'services/navigation';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { ConnectedDevice } from 'models/ConnectedDevice';
import type { SmartWalletAccountDevice } from 'models/SmartWalletAccount';

// actions
import {
  addSmartWalletAccountDeviceAction,
  removeSmartWalletAccountDeviceAction,
  removeDeployedSmartWalletAccountDeviceAction,
} from './smartWalletActions';
import { saveDbAction } from './dbActions';


const removePrompt = (callback) => Alert.alert(
  'Are you sure?',
  'You are going to remove the link between this device and your account.' +
  '\n\nPlease make sure you have all your funds backed up.',
  [
    { text: 'Confirm remove', onPress: callback },
    { text: 'Cancel', style: 'cancel' },
  ],
  { cancelable: true },
);

const getConnectedSmartWalletDevice = (getState: GetState, deviceAddress: string): ?SmartWalletAccountDevice => {
  const smartWalletAccountDevices = get(getState(), 'smartWallet.connectedAccount.devices', []);
  return smartWalletAccountDevices.find(
    ({ device }) => addressesEqual(device.address, deviceAddress),
  );
};

export const setConnectedDevicesAction = (devices: ConnectedDevice[]) => ({
  type: SET_CONNECTED_DEVICES,
  payload: devices,
});

export const addConnectedDeviceAction = (
  deviceCategory: string,
  deviceAddress: string,
  payWithGasToken: boolean = false,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: SET_ADDING_CONNECTED_DEVICE_ADDRESS, payload: deviceAddress });
    if (deviceCategory === DEVICE_CATEGORIES.SMART_WALLET_DEVICE) {
      // error messages handled by smart wallet service
      await dispatch(addSmartWalletAccountDeviceAction(deviceAddress, payWithGasToken));

      // check if account was created
      const smartWalletAccountDevices = get(getState(), 'smartWallet.connectedAccount.devices', []);
      const newSmartWalletAccountDevice: ?SmartWalletAccountDevice = smartWalletAccountDevices.find(
        ({ device }) => addressesEqual(device.address, deviceAddress),
      );

      // check if device was added
      if (!newSmartWalletAccountDevice) {
        dispatch({ type: RESET_ADDING_CONNECTED_DEVICE_ADDRESS });
        Toast.show({
          message: 'Failed to find device in Smart Wallet account',
          type: 'warning',
          title: 'Unable to connect device',
          autoClose: false,
        });
        return;
      }

      // device was added and deployed, add to connected devices
      const connectedDevices = get(getState(), 'connectedDevices.data');
      const newDevice: ConnectedDevice = {
        category: DEVICE_CATEGORIES.SMART_WALLET_DEVICE,
        address: deviceAddress,
        updatedAt: newSmartWalletAccountDevice.updatedAt,
      };
      const updatedDevices = connectedDevices
        .filter(({ address }) => addressesEqual(address, deviceAddress))
        .concat(newDevice);
      dispatch(setConnectedDevicesAction(updatedDevices));
      dispatch({ type: RESET_ADDING_CONNECTED_DEVICE_ADDRESS });
    }
  };
};

export const completeConnectedDeviceRemoveAction = () => {
  return (dispatch: Dispatch) => {
    dispatch({ type: RESET_REMOVING_CONNECTED_DEVICE_ADDRESS });
    dispatch(saveDbAction('connectedDevices', { removingConnectedDeviceAddress: null }));
    Toast.show({
      message: 'Connected device has been removed',
      type: 'success',
      title: 'Success',
      autoClose: true,
    });
  };
};

export const removeConnectedDeviceAction = (
  { category: deviceCategory, address: deviceAddress }: ConnectedDevice,
  payWithGasToken: boolean = false,
) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    dispatch({ type: SET_REMOVING_CONNECTED_DEVICE_ADDRESS, payload: deviceAddress });
    if (deviceCategory === DEVICE_CATEGORIES.SMART_WALLET_DEVICE) {
      if (!isSmartWalletDeviceDeployed(getConnectedSmartWalletDevice(getState, deviceAddress))) {
        await dispatch(removeSmartWalletAccountDeviceAction(deviceAddress));
        dispatch(completeConnectedDeviceRemoveAction());
      } else {
        await dispatch(removeDeployedSmartWalletAccountDeviceAction(deviceAddress, payWithGasToken));
        // transaction might take some time so let's save the state and don't reset it
        dispatch(saveDbAction('connectedDevices', { removingConnectedDeviceAddress: deviceAddress }));
      }
    }
  };
};

export const confirmConnectedDeviceRemoveAction = (device: ConnectedDevice) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    removePrompt(async () => {
      const { category: deviceCategory, address: deviceAddress } = device;
      // might be more categories, i.e. wallet connect dapps
      if (deviceCategory === DEVICE_CATEGORIES.SMART_WALLET_DEVICE) {
        const smartWalletAccountDevice = getConnectedSmartWalletDevice(getState, deviceAddress);
        if (!smartWalletAccountDevice) {
          Toast.show({
            message: 'Matching Smart Wallet device not found',
            type: 'warning',
            title: 'Unable to remove device',
            autoClose: false,
          });
          return;
        }
        // if state is deployed then we need to undeploy device first
        if (isSmartWalletDeviceDeployed(smartWalletAccountDevice)) {
          navigate(NavigationActions.navigate({
            routeName: REMOVE_SMART_WALLET_CONNECTED_DEVICE,
            params: { device },
          }));
          return;
        }
        dispatch(removeConnectedDeviceAction(device));
      }
    });
  };
};
