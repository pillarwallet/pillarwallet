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
import { ARCHANOVA_WALLET_UPGRADE_STATUSES } from 'constants/archanovaConstants';
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// utils
import { accountHasGasTokenSupport, getArchanovaWalletStatus } from 'utils/archanova';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// types
import type { RootReducerState } from 'reducers/rootReducer';
import type { ArchanovaWalletStatus } from 'models/ArchanovaWalletStatus';


export const isArchanovaWalletActivatedSelector = ({
  accounts: { data: accounts },
  smartWallet,
}: RootReducerState,
) => {
  const archanovaWalletStatus: ArchanovaWalletStatus = getArchanovaWalletStatus(accounts, smartWallet);
  return archanovaWalletStatus.status === ARCHANOVA_WALLET_UPGRADE_STATUSES.DEPLOYMENT_COMPLETE;
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
