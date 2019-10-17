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
import smartWalletService from 'services/smartWallet';

import type { AccountTransaction } from 'services/smartWallet';
import type { GasInfo, GasPrice } from 'models/GasInfo';
import { BN } from 'ethereumjs-util';
import { sdkConstants } from '@smartwallet/sdk';

describe('Smart Wallet service', () => {
  const gasInfoPrices: GasPrice = { min: 2, avg: 2, max: 3 };
  const gasInfo: GasInfo = {
    gasPrice: gasInfoPrices,
    isFetched: true,
  };

  const accountTransaction: AccountTransaction = {
    recipient: '0x0',
    value: 1,
  };

  it('account transaction estimate fee should be equal 21000000000000', async () => {
    const fee = await smartWalletService.estimateAccountTransaction(accountTransaction, gasInfo);
    expect(fee.eq(21000000000000)).toBeTruthy();
  });

  // in case SDK method doesn't return price and app gas oracle price is trusted with fast speed
  it('account transaction estimate fee should be equal 63000000000000', async () => {
    jest.spyOn(smartWalletService.sdk, 'estimateAccountTransaction').mockImplementation(() => Promise.resolve({
      gasFee: new BN(21000),
      signedGasPrice: null,
    }));
    const fee = await smartWalletService.estimateAccountTransaction({
      ...accountTransaction,
      transactionSpeed: sdkConstants.GasPriceStrategies.Fast,
    }, gasInfo);
    expect(fee.eq(63000000000000)).toBeTruthy();
  });

  // in case SDK method doesn't return gas fee, but returns price
  it('account transaction estimate fee should be equal 500000000000000', async () => {
    jest.spyOn(smartWalletService.sdk, 'estimateAccountTransaction').mockImplementation(() => Promise.resolve({
      gasFee: null,
      signedGasPrice: { gasPrice: new BN(1000000000) },
    }));
    const fee = await smartWalletService.estimateAccountTransaction(accountTransaction, gasInfo);
    expect(fee.eq(500000000000000)).toBeTruthy();
  });

  // in case of SDK method doesn't return anything
  it('account transaction estimate fee should be equal 1000000000000000', async () => {
    jest.spyOn(smartWalletService.sdk, 'estimateAccountTransaction').mockImplementation(() => Promise.resolve({}));
    const fee = await smartWalletService.estimateAccountTransaction(accountTransaction, gasInfo);
    expect(fee.eq(1000000000000000)).toBeTruthy();
  });
});

