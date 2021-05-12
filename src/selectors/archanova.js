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
import { findFirstArchanovaAccount, getAccountEnsName } from 'utils/accounts';
import { getEnsPrefix } from 'utils/common';
import { isProdEnv } from 'utils/environment';

// services
import { firebaseRemoteConfig } from 'services/firebase';

// selectors
import { useRootSelector } from 'selectors';

// types
import type { RootReducerState } from 'reducers/rootReducer';
import type { ArchanovaWalletStatus } from 'models/ArchanovaWalletStatus';
import { type Chain, CHAIN } from 'models/Chain';

// local
import { accountsSelector } from './selectors';
import { archanovaAccountHistorySelector } from './history';


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

/**
 * return ENS needed if there was no ENS marked transaction sent
 * on any environment (for test purposes as there is no ENS on Kovan testnet)
 * or there's existing ENS name on Archanova account on homestead (Mainnet) environment
 */
export const isEnsMigrationNeededSelector = createSelector(
  accountsSelector,
  archanovaAccountHistorySelector,
  (accounts, archanovaAccountHistory): boolean => {
    const isEnabled = firebaseRemoteConfig.getBoolean(REMOTE_CONFIG.ENS_MIGRATOR_ENABLED);
    if (!isEnabled) return false;

    const archanovaAccount = findFirstArchanovaAccount(accounts);

    const isEnsMigrationNeeded = archanovaAccount
      && (!isProdEnv() || getAccountEnsName(archanovaAccount)?.endsWith(getEnsPrefix()));

    const isEnsMigrationTransactionAlreadySent = archanovaAccountHistory.some(({
      extra,
    }) => extra?.isENSMigrationToEtherspot);

    return !!isEnsMigrationNeeded && !isEnsMigrationTransactionAlreadySent;
  },
);

export const useSmartWalletStatus = (): ArchanovaWalletStatus => {
  const accounts = useRootSelector(root => root.accounts.data);
  const archanovaWalletState = useRootSelector((root) => root.smartWallet);
  return getArchanovaWalletStatus(accounts, archanovaWalletState);
};

// Temporary stuff to get info about smart wallet type
// TODO: combine this with etherspot work once it's in
export const SMART_WALLET_TYPE = {
  ETHERSPOT: ('etherspot': 'etherspot'),
  ARCHANOVA: ('archanova': 'archanova'),
};

export type SmartWalletType = $Values<typeof SMART_WALLET_TYPE>;

export const useSmartWalletType = (): SmartWalletType => {
  return SMART_WALLET_TYPE.ARCHANOVA;
};

export const useSupportedChains = (): Chain[] => {
  const smartWalletType = useSmartWalletType();

  if (smartWalletType === SMART_WALLET_TYPE.ETHERSPOT) {
    return [CHAIN.POLYGON, CHAIN.BINANCE, CHAIN.XDAI, CHAIN.ETHEREUM];
  }

  return [CHAIN.ETHEREUM];
};

export const useIsPillarPaySupported = () => {
  const smartWalletType = useSmartWalletType();
  return smartWalletType === SMART_WALLET_TYPE.ARCHANOVA;
};
