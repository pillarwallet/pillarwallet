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

import { getTokens, getTarget, getSource, toBytes32 } from 'synthetix';
import { utils, Contract } from 'ethers';
import { BigNumber } from 'bignumber.js';

import { getEnv } from 'configs/envConfig';

import { getContract } from 'services/assets';

// utils
import { getEthereumProvider, parseTokenBigNumberAmount } from 'utils/common';
import { isProdEnv } from 'utils/environment';
import { parseOffer } from 'utils/exchange';

import { PROVIDER_SYNTHETIX } from 'constants/exchangeConstants';

// models
import type { Asset } from 'models/Asset';
import type { Offer } from 'models/Offer';

// assets
import ERC20_CONTRACT_ABI from 'abi/erc20.json';

const ethProvider = getEthereumProvider(getEnv().NETWORK_PROVIDER);
const network = isProdEnv ? 'mainnet' : 'kovan';
const { address: exchangeAddress } = getTarget({ network, contract: 'ProxyERC20' });
// const { abi: exchangeAbi } = getSource({ network, contract: 'Synthetix' });

const { address: ratesAddress } = getTarget({ network, contract: 'ExchangeRates' });
const { abi: ratesAbi } = getSource({ network, contract: 'ExchangeRates' });

export const fetchSynthetixSupportedAssets = () => getTokens({ network }).map(token => token.symbol);

export const exchange = async () => {
  //
};

const getSynthetixAllowance = async (clientAddress: string, fromTokenAddress: string) => {
  const assetContract = new Contract(fromTokenAddress, ERC20_CONTRACT_ABI, ethProvider);
  const allowance = await assetContract.allowance(clientAddress, exchangeAddress);
  return allowance.gt(0);
};

export const getSynthetixOffer = async (
  fromAsset: Asset, toAsset: Asset, amount: string | number, clientAddress: string,
): Promise<Offer | null> => {
  const contract = getContract(ratesAddress, ratesAbi);
  if (!contract) return null;
  const toValue = await contract.effectiveValue(
    toBytes32(fromAsset),
    parseTokenBigNumberAmount(amount, fromAsset.decimals),
    toBytes32(toAsset),
  );
  const toAmount = utils.formatUnits(toValue.toString(), toAsset.decimals);
  const allowanceSet = await getSynthetixAllowance(clientAddress, fromAsset.address);
  const amountBN = new BigNumber(amount.toString());
  const toAmountBN = new BigNumber(toAmount.toString());
  const askRate = toAmountBN.dividedBy(amountBN);

  return parseOffer(fromAsset, toAsset, allowanceSet, askRate, PROVIDER_SYNTHETIX);
};

// to be used in exchangeActions: setTokenAllowanceAction
export const createSynthetixAllowanceTx = async () => {

};

