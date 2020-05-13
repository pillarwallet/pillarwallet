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
import isEmpty from 'lodash.isempty';
import { ethers } from 'ethers';
import { sdkConstants } from '@smartwallet/sdk';
import { Api } from '@smartwallet/sdk/build/modules';

// actions
import { addConnectedDeviceAction } from 'actions/connectedDevicesActions';
import { generateWalletMnemonicAction } from 'actions/walletActions';

// constants
import {
  RECOVERY_PORTAL_SETUP_COMPLETE,
  SET_WALLET_PIN_CODE,
} from 'constants/navigationConstants';
import { DEVICE_CATEGORIES } from 'constants/connectedDevicesConstants';
import {
  RESET_RECOVERY_PORTAL_TEMPORARY_WALLET,
  SET_RECOVERY_PORTAL_TEMPORARY_WALLET,
} from 'constants/recoveryPortalConstants';
import { SET_WALLET_RECOVERY_PENDING } from 'constants/walletConstants';

// utils
import { addressesEqual } from 'utils/assets';
import { generateMnemonicPhrase } from 'utils/wallet';

// services
import { navigate } from 'services/navigation';
import smartWalletService from 'services/smartWallet';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { EthereumWallet } from 'models/Wallet';

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

export const checkIfRecoveredSmartWalletFinishedAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    // in case deployment was faster than user encrypted the wallet (set pin flow)
    const encryptedWalletAddress = get(getState(), 'wallet.data.address');
    if (!encryptedWalletAddress) return;

    if (isEmpty(smartWalletService.sdk.state.account)) {
      const accounts = await smartWalletService.getAccounts();
      if (isEmpty(accounts)) return;
      await smartWalletService.connectAccount(accounts[0].address);
    }
    const { devices = [], activeDeviceAddress } = await smartWalletService.fetchConnectedAccount();
    if (!activeDeviceAddress) return;

    const thisDevice = devices.find(({ device: { address } }) => addressesEqual(activeDeviceAddress, address));
    if (!thisDevice || thisDevice.state !== sdkConstants.AccountDeviceStates.Deployed) return;

    console.log('RECOVERY FINISHED!!!');
    // 1. TODO: re-assign username
    // 2. TODO: fire finish registration action
  };
};

export const checkRecoveredSmartWalletStateAction = (event: Api.IEvent) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const eventName = get(event, 'name');
    const transactionType = get(event, 'payload.state');
    const transactionHash = get(event, 'payload.hash');
    if (eventName === Api.EventNames.AccountTransactionUpdated
      && !isEmpty(transactionHash)
      && !isEmpty(transactionType)) {
      if (transactionType === sdkConstants.AccountTransactionStates.Created) {
        // device was connected to account
        const { recoveryPortal: { temporaryWallet } } = getState();
        if (!temporaryWallet) return;
        const accounts = await smartWalletService.getAccounts();
        // if account is attached to current instance then this means that new device has been connected
        if (!isEmpty(accounts)) {
          await smartWalletService.connectAccount(accounts[0].address);
          // we can add wallet to onboarding reducer and move with PIN screen to encrypt it
          dispatch(generateWalletMnemonicAction(temporaryWallet.mnemonic));
          // reset temporary wallet
          dispatch({ type: RESET_RECOVERY_PORTAL_TEMPORARY_WALLET });
          // set recovery pending state, will be saved once PIN is set along with encrypted wallet
          dispatch({ type: SET_WALLET_RECOVERY_PENDING });
          // move to pin screen to encrypt wallet while recovery pending
          navigate(NavigationActions.navigate({ routeName: SET_WALLET_PIN_CODE, params: { noBack: true } }));
        }
        return;
      }
      if (transactionType === sdkConstants.AccountTransactionStates.Completed) {
        dispatch(checkIfRecoveredSmartWalletFinishedAction());
      }
    }
  };
};

export const initRecoveryPortalWalletRecoverAction = () => {
  return async (dispatch: Dispatch) => {
    // make sure everything is reset
    dispatch({ type: RESET_RECOVERY_PORTAL_TEMPORARY_WALLET });
    await smartWalletService.reset();

    // let's create new temporary wallet
    const mnemonic = generateMnemonicPhrase();
    const { address, privateKey, path } = ethers.Wallet.fromMnemonic(mnemonic);
    const wallet: EthereumWallet = {
      address,
      privateKey,
      mnemonic,
      path,
    };

    // set temporary smart wallet and subscribe for events
    await smartWalletService.init(wallet.privateKey, (event) => dispatch(checkRecoveredSmartWalletStateAction(event)));
    dispatch({ type: SET_RECOVERY_PORTAL_TEMPORARY_WALLET, payload: wallet });
  };
};
