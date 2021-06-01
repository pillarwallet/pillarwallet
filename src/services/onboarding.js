// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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

// constants
import { ACCOUNT_TYPES } from 'constants/accountsConstants';

// services
import { ArchanovaService } from 'services/archanova';
import { EtherspotService, getEtherspotSupportService } from 'services/etherspot';

// utils
import {
  getEnsName,
  isCaseInsensitiveMatch,
  reportErrorLog,
} from 'utils/common';

// types
import type { Account } from 'models/Account';


// this should remain isolated from general Archanova/Etherspot service wrappers
export const getExistingServicesAccounts = async (privateKey: string): Promise<Account[]> => {
  const etherspotService = new EtherspotService();
  await etherspotService.init(privateKey);
  const etherspotAccounts = await etherspotService.getAccounts();
  let etherspotMappedAccounts = [];
  if (etherspotAccounts) {
    etherspotMappedAccounts = await Promise.all(etherspotAccounts.map(async ({ address }) => {
      // $FlowFixMe: Account extras
      const extra = await etherspotService.getAccountPerChains(address);
      return {
        id: address,
        type: ACCOUNT_TYPES.ETHERSPOT_SMART_WALLET,
        extra,
        isActive: false,
      };
    }));
  }

  const archanovaService = new ArchanovaService();
  await archanovaService.init(privateKey);
  const archanovaAccounts = await archanovaService.getAccounts();
  let archanovaMappedAccounts = [];
  if (archanovaAccounts) {
    archanovaMappedAccounts = archanovaAccounts.map((account) => ({
      id: account.address,
      type: ACCOUNT_TYPES.ARCHANOVA_SMART_WALLET,
      extra: account,
      isActive: false,
    }));
  }

  return [...etherspotMappedAccounts, ...archanovaMappedAccounts];
};

// this should remain isolated from general Archanova/Etherspot service wrappers
export const isUsernameTaken = async (username: string): Promise<boolean> => {
  const etherspotService = await getEtherspotSupportService();
  if (!etherspotService) {
    reportErrorLog('isUsernameTaken -> getEtherspotSupportService failed', { username });
    return false;
  }

  try {
    const ensName = getEnsName(username);
    const result = await etherspotService.getEnsNode(ensName);
    return isCaseInsensitiveMatch(result?.name, ensName);
  } catch (error) {
    reportErrorLog('isUsernameTaken failed', { username, error });
    return false;
  }
};
