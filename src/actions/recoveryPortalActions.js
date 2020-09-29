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
import { sdkConstants, sdkModules } from '@smartwallet/sdk';
import t from 'translations/translate';

// actions
import { addConnectedDeviceAction } from 'actions/connectedDevicesActions';
import { finishOnboardingAction } from 'actions/onboardingActions';

// constants
import { RECOVERY_PORTAL_SETUP_COMPLETE, SET_WALLET_PIN_CODE } from 'constants/navigationConstants';
import { DEVICE_CATEGORIES } from 'constants/connectedDevicesConstants';
import { SET_IS_PORTAL_RECOVERY, SET_ONBOARDING_WALLET } from 'constants/onboardingConstants';

// components
import Toast from 'components/Toast';

// utils
import { addressesEqual } from 'utils/assets';
import { generateMnemonicPhrase } from 'utils/wallet';

// services
import { navigate } from 'services/navigation';
import smartWalletService from 'services/smartWallet';

// types
import type { Dispatch, GetState } from 'reducers/rootReducer';
import type { EthereumWallet } from 'models/Wallet';


export const addRecoveryPortalDeviceAction = (deviceAddress: string, payWithGasToken: boolean = false) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    await dispatch(addConnectedDeviceAction(DEVICE_CATEGORIES.SMART_WALLET_DEVICE, deviceAddress, payWithGasToken));
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

export const checkAndFinishSmartWalletRecoveryAction = () => {
  return async (dispatch: Dispatch, getState: GetState) => {
    // in case deployment was faster than user encrypted the wallet (set pin flow)
    if (!getState()?.wallet?.data?.address) return;

    const connectedAccount = get(smartWalletService, 'sdk.state.account');
    if (isEmpty(connectedAccount)) {
      const accounts = await smartWalletService.getAccounts();
      if (isEmpty(accounts)) return;
      await smartWalletService.connectAccount(accounts[0].address);
    }

    const {
      devices = [],
      activeDeviceAddress,
      address: connectedAccountAddress,
    } = await smartWalletService.fetchConnectedAccount() || {};

    if (!activeDeviceAddress) return;

    const thisDevice = devices.find(({ device: { address } }) => addressesEqual(activeDeviceAddress, address));

    if (!thisDevice || thisDevice.state !== sdkConstants.AccountDeviceStates.Deployed) return;

    // device is deployed, proceed to register
    const recoveryData = {
      deviceAddress: activeDeviceAddress,
      accountAddress: connectedAccountAddress,
    };

    await dispatch(finishOnboardingAction(false, recoveryData));

    Toast.show({
      message: t('toast.walletRecovered'),
      emoji: 'tada',
    });
  };
};

export const checkRecoveredSmartWalletStateAction = (event: sdkModules.Api.IEvent) => {
  return async (dispatch: Dispatch, getState: GetState) => {
    const {
      wallet: { data: storedWallet },
      onboarding: { wallet: onboardingWallet },
    } = getState();

    // depending on recovery state it can either be saved or onboading
    const wallet = storedWallet || onboardingWallet;

    if (!wallet) return;

    const eventName = get(event, 'name');
    const transactionType = get(event, 'payload.state');
    const transactionHash = get(event, 'payload.hash');

    if (eventName === sdkModules.Api.EventNames.AccountTransactionUpdated
      && !isEmpty(transactionHash)
      && !isEmpty(transactionType)) {
      if (transactionType === sdkConstants.AccountTransactionStates.Created) {
        // device was connected to account
        const accounts = await smartWalletService.getAccounts();
        // if account is attached to current instance then this means that new device has been connected
        if (!isEmpty(accounts)) {
          await smartWalletService.connectAccount(accounts[0].address);
          // move to pin screen to encrypt wallet while recovery pending
          navigate(NavigationActions.navigate({ routeName: SET_WALLET_PIN_CODE, params: { noBack: true } }));
        }
        return;
      }
      if (transactionType === sdkConstants.AccountTransactionStates.Completed) {
        dispatch(checkAndFinishSmartWalletRecoveryAction());
      }
    }
  };
};

export const initRecoveryPortalWalletRecoverAction = () => {
  return async (dispatch: Dispatch) => {
    // make sure everything onboarding wallet and smart wallet service are reset
    dispatch({ type: SET_ONBOARDING_WALLET, payload: null });
    await smartWalletService.reset();

    dispatch({ type: SET_IS_PORTAL_RECOVERY });

    // let's create new onboading wallet
    const mnemonic = generateMnemonicPhrase();
    const { address, privateKey } = ethers.Wallet.fromMnemonic(mnemonic);
    const wallet: EthereumWallet = {
      address,
      privateKey,
      mnemonic,
    };

    // set temporary smart wallet and subscribe for events
    await smartWalletService.init(privateKey, (event) => dispatch(checkRecoveredSmartWalletStateAction(event)));
    dispatch({ type: SET_ONBOARDING_WALLET, payload: wallet });
  };
};
