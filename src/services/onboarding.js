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
  logBreadcrumb,
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
      let extra = await etherspotService.getAccountPerChains();

      // if no actual ENS name set for Etherspot account let's try fetch reserved one
      if (!extra.ethereum?.ensNode) {
        const ensNode = await etherspotService.getEnsNode(address);
        extra = {
          ...extra,
          ethereum: {
            ...extra.ethereum,
            ensNode,
          },
        };
      }

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

  /**
   * keep Archanova accounts first as this is used for ENS name checks
   * and Etherspot may contain reserved names while Archanova can contain
   * ENS names of legacy users that are already set
   */
  return [...archanovaMappedAccounts, ...etherspotMappedAccounts];
};

// this should remain isolated from general Archanova/Etherspot service wrappers
export const isUsernameTaken = async (username: string): Promise<boolean> => {
  const etherspotService = await getEtherspotSupportService();
  if (!etherspotService) {
    logBreadcrumb('isUsernameTaken', 'getEtherspotSupportService failed', { username });
    return false;
  }

  const ensName = getEnsName(username);

  const isValid = await etherspotService.isValidEnsName(ensName);
  if (!isValid) return true; // invalid/blacklisted/taken/error

  const result = await etherspotService.getEnsNode(ensName);
  return isCaseInsensitiveMatch(result?.name, ensName);
};
