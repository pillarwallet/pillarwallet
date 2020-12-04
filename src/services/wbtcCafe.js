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
import { WBTC, BTC } from 'constants/assetsConstants';
import { WBTC_PENDING_TRANSACTION } from 'constants/exchangeConstants';
import { TX_PENDING_STATUS } from 'constants/historyConstants';
import CURVE_ABI from 'abi/WBTCCurve.json';
import { getEthereumProvider, reportLog } from 'utils/common';
import type { WBTCFeesWithRate, WBTCFeesRaw, PendingWBTCTransaction } from 'models/WBTC';
import type { Transaction } from 'models/Transaction';
import { getEnv } from 'configs/envConfig';
import Toast from 'components/Toast';
import t from 'translations/translate';
/* eslint-disable i18next/no-literal-string */

// much of this function's body is copy-pasted from wbtc.cafe web app code
export const gatherWBTCFeeData = async (
  amount: number,
  fees: ?WBTCFeesRaw,
  fromAssetCode: string,
): Promise<?WBTCFeesWithRate> => {
  if (!fees || !fromAssetCode) return null;
  const isSellingWbtc = fromAssetCode === WBTC;
  const fixedFeeKey = isSellingWbtc ? 'release' : 'lock';
  const dynamicFeeKey = isSellingWbtc ? 'burn' : 'mint';

  const fixedFee = Number(fees[BTC.toLowerCase()][fixedFeeKey] / 100000000); // / 10 ** 8
  const dynamicFeeRate = Number(
    fees[BTC.toLowerCase()].ethereum[dynamicFeeKey] / 10000,
  );

  try {
    const isProdEnv = getEnv().NETWORK_PROVIDER === 'homestead';
    let exchangeRate;
    let total;

    const curve = new Contract(
      getEnv().WBTC_CURVE,
      CURVE_ABI,
      getEthereumProvider(isProdEnv ? 'homestead' : 'kovan'),
    );
    const renVMFee = Number(amount) * dynamicFeeRate;
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
    return {
      exchangeRate, renVMFee, networkFee: fixedFee, estimate: total,
    };
  } catch (e) {
    reportLog('Failed to estimate WBTC fees and exchange rate', e);
    return null;
  }
};

export const getWbtcCafeTransactions = (history: Transaction[]): Transaction[] => {
  const address = getEnv().WBTC_FROM_ADDRESS;
  return history.filter(({ from }) => from === address);
};

export const getValidPendingTransactions = (txs: PendingWBTCTransaction[]): PendingWBTCTransaction[] =>
  txs.filter(({ dateCreated }) => dateCreated && Date.now() - dateCreated < 12 * 3600000); // 12 hours old or younger

// map pending txs to Transaction objects so they can pretend to be valid History items
export const mapPendingToTransactions = (pendingTxs: PendingWBTCTransaction[], to?: ?string): Transaction[] => {
  return pendingTxs.map(tx => ({
    _id: String(tx.dateCreated),
    from: getEnv().WBTC_FROM_ADDRESS,
    status: TX_PENDING_STATUS,
    asset: WBTC,
    value: String(tx.amount * 1000000000000000000), // 18 decimals
    createdAt: tx.dateCreated / 1000,
    to: to || '',
    hash: '',
    type: 'transactionEvent',
    tag: WBTC_PENDING_TRANSACTION,
  }));
};

export const showWbtcErrorToast = () => {
  if (!Toast.isVisible()) {
    Toast.show({
      message: t('wbtcCafe.error'),
      emoji: 'woman-shrugging',
      autoClose: true,
    });
  }
};
