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

import { Contract } from 'ethers';

import { isProdEnv } from 'utils/environment';
import { WBTC, BTC } from 'constants/assetsConstants';
import { WBTC_CURVE_MAIN, WBTC_CURVE_TEST } from 'constants/exchangeConstants';

import CURVE_ABI from 'abi/WBTCCurve.json';
import { getEthereumProvider, reportLog } from 'utils/common';

import type { WBTCFeesWithRate, WBTCFeesRaw } from 'models/WBTC';

export const gatherWBTCFeeData = async (
  amount: number,
  fees: WBTCFeesRaw,
  fromAssetCode: string,
): Promise<?WBTCFeesWithRate> => {
  if (!amount || !fees || !fromAssetCode) return null;
  const isSellingWbtc = fromAssetCode === WBTC;
  const fixedFeeKey = isSellingWbtc ? 'release' : 'lock';
  const dynamicFeeKey = isSellingWbtc ? 'burn' : 'mint';

  const fixedFee = Number(fees[BTC.toLowerCase()][fixedFeeKey] / 100000000); // / 10 ** 8
  const dynamicFeeRate = Number(
    fees[BTC.toLowerCase()].ethereum[dynamicFeeKey] / 10000,
  );

  try {
    let exchangeRate;
    let renVMFee;
    let total;
    const amountInSats = Math.round(amount * 100000000);

    const curve = new Contract(
      isProdEnv ? WBTC_CURVE_MAIN : WBTC_CURVE_TEST,
      CURVE_ABI,
      getEthereumProvider(isProdEnv ? 'homestead' : 'kovan'),
    );
    // WBTC => BTC
    if (isSellingWbtc) {
      const dy = await curve.get_dy(0, 1, amountInSats);
      const swapResult = dy / 100000000; // res / 10 ** 8
      exchangeRate = Number(swapResult / amount);
      renVMFee = Number(swapResult) * dynamicFeeRate;
      total =
        Number(swapResult - renVMFee - fixedFee) > 0
          ? Number(swapResult - renVMFee - fixedFee)
          : 0.000000;
    // BTC => WBTC
    } else {
      renVMFee = Number(amount) * dynamicFeeRate;
      const amountAfterMint =
        Number(amount - renVMFee - fixedFee) > 0
          ? Number(amount - renVMFee - fixedFee)
          : 0;
      const amountAfterMintInSats = Math.round(amountAfterMint * 100000000);

      if (amountAfterMintInSats) {
        const dy = await curve.get_dy(0, 1, amountAfterMintInSats);
        const swapResult = dy / 100000000; // res / 10 ** 8
        exchangeRate = Number(swapResult / amountAfterMint);
        total = Number(swapResult);
      } else {
        exchangeRate = Number(0);
        total = Number(0);
      }
    }
    return {
      exchangeRate, renVMFee, networkFee: fixedFee, estimate: total,
    };
  } catch (e) {
    reportLog('Failed to estimate WBTC fees and exchange rate', e);
    return null;
  }
};
