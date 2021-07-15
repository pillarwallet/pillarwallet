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
import {
  useRootSelector,
} from 'selectors';

// Utils
import { fromBaseUnit } from 'utils/bigNumber';
import { getGasDecimals, getGasAddress, getGasSymbol } from 'utils/transactions';

// Types
import type { Chain } from 'models/Chain';


export const useTransactionFeeInfo = (chain: Chain) => {
  const feeInfo = useRootSelector((root) => root.transactionEstimate.feeInfo);
  const isEstimating = useRootSelector((root) => root.transactionEstimate.isEstimating);
  const estimationErrorMessage = useRootSelector((root) => root.transactionEstimate.errorMessage);

  const decimals = getGasDecimals(chain, feeInfo?.gasToken);
  const fee = feeInfo?.fee ? fromBaseUnit(feeInfo.fee, decimals) : null;
  const gasAddress = getGasAddress(chain, feeInfo?.gasToken);
  const gasSymbol = getGasSymbol(chain, feeInfo?.gasToken);

  return { fee, gasAddress, gasSymbol, isEstimating, estimationErrorMessage };
};
