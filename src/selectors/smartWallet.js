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

// constants
import { ETH } from 'constants/assetsConstants';
import { SMART_WALLET_UPGRADE_STATUSES } from 'constants/smartWalletConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// utils
import { accountHasGasTokenSupport, getSmartWalletStatus } from 'utils/smartWallet';
import { checkIfSmartWalletAccount } from 'utils/accounts';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// selectors
import { useRootSelector, activeAccountSelector } from 'selectors';

// types
import type { RootReducerState } from 'reducers/rootReducer';
import type { SmartWalletStatus } from 'models/SmartWalletStatus';


export const isSmartWalletActivatedSelector = ({
  accounts: { data: accounts },
  smartWallet,
}: RootReducerState,
) => {
  const smartWalletStatus: SmartWalletStatus = getSmartWalletStatus(accounts, smartWallet);
  return smartWalletStatus.status === SMART_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE;
};

export const isGasTokenSupportedSelector = ({ smartWallet: { connectedAccount } }: RootReducerState) => {
  return accountHasGasTokenSupport(connectedAccount);
};

export const preferredGasTokenSelector = ({ appSettings: { data: { preferredGasToken } } }: RootReducerState) => {
  if (!firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.APP_FEES_PAID_WITH_PLR)) return ETH;
  return preferredGasToken || ETH;
};

export const useGasTokenSelector = createSelector(
  isGasTokenSupportedSelector,
  preferredGasTokenSelector,
  (isGasTokenSupported, preferredGasToken) => {
    return isGasTokenSupported && preferredGasToken !== ETH;
  },
);

export const isActiveAccountSmartWalletSelector = createSelector(
  activeAccountSelector,
  (activeAccount) => {
    return activeAccount && checkIfSmartWalletAccount(activeAccount);
  },
);

export const useSmartWalletStatus = (): SmartWalletStatus => {
  const accounts = useRootSelector(root => root.accounts.data);
  const smartWalletState = useRootSelector((root) => root.smartWallet);
  return getSmartWalletStatus(accounts, smartWalletState);
};

// Temporary stuff to get info about smart wallet type
export type SmartWalletType = "etherspot" | "archanova";

export const SMART_WALLET_TYPES = {
  ETHERSPOT: ('etherspot': 'etherspot'),
  ARCHANOVA: ('archanova': 'archanova'),
};

export const useSmartWalletType = (): SmartWalletType => {
  return SMART_WALLET_TYPES.ETHERSPOT;
};
