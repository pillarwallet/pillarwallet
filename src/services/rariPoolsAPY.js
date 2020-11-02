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
import axios from 'axios';
import { BigNumber as EthersBigNumber } from 'ethers';
import { reportErrorLog } from 'utils/common';
import { callSubgraph } from 'services/theGraph';
import { getEnv } from 'configs/envConfig';


const floatingPointToBN = (floatingPoint: number) => {
  return EthersBigNumber.from(Math.trunc(parseFloat(floatingPoint) * 1e18).toFixed(0));
};

export const getDydxApyBNs = async () => {
  let markets;
  try {
    ({ data: { markets } } = await axios.get('https://api.dydx.exchange/v1/markets'));
  } catch (error) {
    reportErrorLog("Rari service failed: Can't get dxdy apy", { error });
    return null;
  }
  const result = markets
    .filter(market => ['DAI', 'USDC', 'USDT'].includes(market.symbol))
    .reduce((APY, market) => {
      APY[market.symbol] = floatingPointToBN(market.totalSupplyAPR);
      return APY;
    }, {});
  return result;
};

export const getCompoundApyBNs = async () => {
  let cToken;
  try {
    ({ data: { cToken } } = await axios.get('https://api.compound.finance/api/v2/ctoken'));
  } catch (error) {
    reportErrorLog("Rari service failed: Can't get compound apy", { error });
    return null;
  }
  const result = cToken
    .filter(token => ['DAI', 'USDC', 'USDT'].includes(token.underlying_symbol))
    .reduce((APY, token) => {
      const supplyAPY = floatingPointToBN(token.supply_rate.value);
      const compAPY = floatingPointToBN(token.comp_supply_apy.value / 100);
      APY[token.underlying_symbol] = supplyAPY.add(compAPY);
      return APY;
    }, {});
  return result;
};

export const getAaveApyBNs = async () => {
  /* eslint-disable i18next/no-literal-string */
  const query = `{
    reserves(where: {
      symbol_in: ["DAI", "USDC", "USDT", "TUSD", "BUSD", "SUSD"]
    }) {
      symbol
      liquidityRate
    }
  }`;
  /* eslint-enable i18next/no-literal-string */
  const data = await callSubgraph(getEnv().AAVE_SUBGRAPH_NAME, query);
  if (!data) return null;
  const result = data.reserves.reduce((APY, reserve) => {
    // eslint-disable-next-line i18next/no-literal-string
    const symbol = reserve.symbol === 'SUSD' ? 'sUSD' : reserve.symbol;
    APY[symbol] = EthersBigNumber.from(reserve.liquidityRate).div(EthersBigNumber.from(1e9));
    return APY;
  }, {});
  return result;
};

const calculateMStableApyBN = async () => {
  const epochNow = Math.floor(Date.now() / 1000);
  const epoch24HrsAgo = epochNow - 86400;
  /* eslint-disable i18next/no-literal-string */
  const query = `{
    day0: exchangeRates(where: {timestamp_lt: ${epoch24HrsAgo}}, orderDirection: desc, orderBy: timestamp, first: 1) {
      exchangeRate
      timestamp
    }
    day1: exchangeRates(where: {timestamp_lt: ${epochNow}}, orderDirection: desc, orderBy: timestamp, first: 1) {
      exchangeRate
      timestamp
    }
  }`;
  /* eslint-enable i18next/no-literal-string */
  const data = await callSubgraph(getEnv().MSTABLE_SUBGRAPH_NAME, query);
  if (!data) return null;
  const startExchangeRate = data.day0[0].exchangeRate;
  const endExchangeRate = data.day1[0].exchangeRate;
  const SCALE = 1e18;
  const YEAR_BN = 365 * 24 * 60 * 60;

  const rateDiff = ((endExchangeRate * SCALE) / startExchangeRate) - SCALE;
  const timeDiff = epochNow - epoch24HrsAgo;

  const portionOfYear = (timeDiff * SCALE) / YEAR_BN;
  const portionsInYear = SCALE / portionOfYear;
  const rateDecimals = (SCALE + rateDiff) / SCALE;

  if (rateDecimals > 0) {
    const diff = rateDecimals ** portionsInYear;
    const parsed = diff * SCALE;
    return EthersBigNumber.from((parsed - SCALE).toFixed(0)) || EthersBigNumber.from(0);
  }

  return EthersBigNumber.from(0);
};

export const getMStableApyBN = async () => {
  const apy = await calculateMStableApyBN();
  if (!apy) return null;
  return { mUSD: apy };
};
