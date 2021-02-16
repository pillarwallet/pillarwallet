/* eslint-disable i18next/no-literal-string */
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

import Web3 from 'web3';
import Rari from '@rari-capital/rari-sdk';
import { BigNumber } from 'bignumber.js';
import { useQuery } from 'react-query';
import { getEnv } from 'configs/envConfig';

const INFURA_MAINNET_WEB_SOCKET = `wss://mainnet.infura.io/ws/v3/${getEnv().INFURA_PROJECT_ID}`;
const INFURA_KOVAN_WEB_SOCKET = `wss://mainnet.infura.io/ws/v3/${getEnv().INFURA_PROJECT_ID}`;

const getWeb3Provider = () => {
  const socketAddress = getEnv().NETWORK_PROVIDER === 'kovan' ? INFURA_MAINNET_WEB_SOCKET : INFURA_KOVAN_WEB_SOCKET;
  return new Web3(new Web3.providers.WebsocketProvider(socketAddress));
};

const getRariClient = () => {
  return new Rari(getWeb3Provider());
};

const toBigNumber = (bn: any): BigNumber => {
  return new BigNumber(bn.toString());
};

export const fetchYieldCurrentApy = async (): Promise<BigNumber> => {
  const value = await getRariClient().pools.yield.apy.getCurrentRawApy();
  return toBigNumber(value).dividedBy(1e18);
};

export const fetchStableCurrentApy = async (): Promise<BigNumber> => {
  const value = await getRariClient().pools.stable.apy.getCurrentRawApy();
  return toBigNumber(value).dividedBy(1e18);
};

export const fetchEthereumCurrentApy = async (): Promise<BigNumber> => {
  const value = await getRariClient().pools.ethereum.apy.getCurrentRawApy();
  return toBigNumber(value).dividedBy(1e18);
};

export const useYieldCurrentApy = () => {
  return useQuery('Rari.Yield.CurrentApy', fetchYieldCurrentApy);
};

export const useStableCurrentApy = () => {
  return useQuery('Rari.Stable.CurrentApy', fetchStableCurrentApy);
};

export const useEthereumCurrentApy = () => {
  return useQuery('Rari.Ethereum.CurrentApy', fetchEthereumCurrentApy);
};
