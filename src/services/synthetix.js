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

/* eslint-disable i18next/no-literal-string */

import { utils, Contract } from 'ethers';
import { BigNumber } from 'bignumber.js';

import { getEnv } from 'configs/envConfig';

import { getContract, encodeContractMethod } from 'services/assets';

// utils
import { getEthereumProvider, parseTokenBigNumberAmount, reportOrWarn } from 'utils/common';
import { parseOffer, createAllowanceTx } from 'utils/exchange';

import { PROVIDER_SYNTHETIX, SYNTHETIX_VP_CODE } from 'constants/exchangeConstants';

// models
import type { Asset } from 'models/Asset';
import type { Offer } from 'models/Offer';
import type { AllowanceTransaction } from 'models/Transaction';

// assets
import ERC20_CONTRACT_ABI from 'abi/erc20.json';
import RATES_ABI from 'abi/synthetixRates.json';
import EXCHANGE_ABI from 'abi/synthetixExchange.json';

const ethProvider = getEthereumProvider(getEnv().NETWORK_PROVIDER);

export const createSynthetixOrder = async (
  fromAsset: Asset, toAsset: Asset, amount: string | number, clientSendAddress: string,
): Promise<Object> => {
  try {
    const exchangeAddress = getEnv().SYNTHETIX_EXCHANGE_ADDRESS;
    const data = encodeContractMethod(
      EXCHANGE_ABI,
      'exchangeWithTracking',
      [
        utils.formatBytes32String(fromAsset.symbol),
        parseTokenBigNumberAmount(amount, fromAsset.decimals),
        utils.formatBytes32String(toAsset.symbol),
        clientSendAddress,
        SYNTHETIX_VP_CODE,
      ],
    );

    if (!data) throw new Error('Failed to encode transaction data');

    const txCount = await ethProvider.getTransactionCount(clientSendAddress);

    const txObject = {
      data,
      nonce: txCount.toString(),
      to: exchangeAddress,
    };

    return {
      orderId: '-',
      sendToAddress: exchangeAddress,
      transactionObj: txObject,
    };
  } catch (e) {
    reportOrWarn(`Synthetix exchange failed for pair ${fromAsset.symbol}-${toAsset.symbol}`, e, 'warning');
    return null;
  }
};

const getSynthetixAllowance = async (clientAddress: string, fromTokenAddress: string): Promise<boolean> => {
  try {
    const assetContract =
      new Contract(fromTokenAddress, ERC20_CONTRACT_ABI, getEthereumProvider(getEnv().NETWORK_PROVIDER));
    const allowance = await assetContract.allowance(clientAddress, getEnv().SYNTHETIX_EXCHANGE_ADDRESS);
    return allowance.gt(0);
  } catch (e) {
    reportOrWarn(`Failed to fetch Synthetix allowance for token ${fromTokenAddress}`, e, 'warning');
    return false;
  }
};

export const getSynthetixOffer = async (
  fromAsset: Asset, toAsset: Asset, amount: string, clientAddress: string,
): Promise<Offer | null> => {
  try {
    const ratesAddress = getEnv().SYNTHETIX_RATES_ADDRESS;
    const contract = getContract(ratesAddress, RATES_ABI);
    if (!contract) return null;
    const toValue = await contract.effectiveValue(
      utils.formatBytes32String(fromAsset.symbol),
      parseTokenBigNumberAmount(amount, fromAsset.decimals),
      utils.formatBytes32String(toAsset.symbol),
    );
    const toAmount = utils.formatUnits(toValue.toString(), toAsset.decimals);
    const allowanceSet = await getSynthetixAllowance(clientAddress, fromAsset.address);
    const amountBN = new BigNumber(amount);
    const toAmountBN = new BigNumber(toAmount.toString());
    const askRate = toAmountBN.dividedBy(amountBN).toNumber().toFixed(5);

    return parseOffer(fromAsset, toAsset, allowanceSet, askRate, PROVIDER_SYNTHETIX);
  } catch (e) {
    reportOrWarn(`Synthetix estimate failed for pair ${fromAsset.symbol}-${toAsset.symbol}`, e, 'warning');
    return null;
  }
};

export const createSynthetixAllowanceTx =
  async (fromAssetAddress: string, clientAddress: string): Promise<AllowanceTransaction | null> => {
    const allowanceTx = createAllowanceTx(fromAssetAddress, clientAddress, getEnv().SYNTHETIX_EXCHANGE_ADDRESS);
    return allowanceTx;
  };

