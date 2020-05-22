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
import { BigNumber } from 'bignumber.js';
import type { FeeInfo } from 'models/PaymentNetwork';
import type { GasToken } from 'models/Transaction';


export const getTxFeeInWei = (useGasToken: boolean, feeInfo: ?FeeInfo): BigNumber | number => {
  const gasTokenCost = get(feeInfo, 'gasTokenCost');
  if (useGasToken && gasTokenCost) return gasTokenCost;
  return get(feeInfo, 'totalCost', 0); // TODO: return 'new BigNumber(0)' by default
};

export const getGasToken = (useGasToken: boolean, feeInfo: ?FeeInfo): ?GasToken => {
  return useGasToken ? get(feeInfo, 'gasToken', null) : null;
};
