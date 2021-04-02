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

// Selectors
import { useRootSelector } from 'selectors';
import { accountCollectiblesSelector } from 'selectors/collectibles';
import { contactsCountSelector } from 'selectors/contacts';

// Utils
import { BigNumber } from 'utils/common';

// Types
import type { WalletInfo } from 'models/Home';

export const useWalletInfo = (): WalletInfo => {
  const collectiblesCount = useRootSelector(accountCollectiblesSelector).length;
  const contactsCount = useRootSelector(contactsCountSelector);

  // TODO: replace with proper implentation when available
  return {
    mainnet: {
      wallet: {
        balanceInFiat: BigNumber(306.4),
        profitInFiat: BigNumber(7.2),
      },
      deposits: {
        balanceInFiat: BigNumber(53120.92),
        profitInFiat: BigNumber(5670.0),
      },
      investments: {
        balanceInFiat: BigNumber(658.81),
        profitInFiat: BigNumber(-23.45),
      },
      collectibles: collectiblesCount,
      contacts: contactsCount,
    },
  };
};
