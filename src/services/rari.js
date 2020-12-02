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
import { utils, BigNumber as EthersBigNumber } from 'ethers';
import maxBy from 'lodash.maxby';
import { getContract } from 'services/assets';
import { callSubgraph } from 'services/theGraph';
import {
  getDydxApyBNs,
  getCompoundApyBNs,
  getAaveApyBNs,
  getMStableApyBN,
} from 'services/rariPoolsAPY';
import { getEnv, getRariPoolsEnv } from 'configs/envConfig';
import { reportErrorLog } from 'utils/common';
import { RARI_POOLS_ARRAY, RARI_POOLS, RARI_TOKENS } from 'constants/rariConstants';
import { ETH } from 'constants/assetsConstants';
import RARI_FUND_MANAGER_CONTRACT_ABI from 'abi/rariFundManager.json';
import RARI_FUND_PROXY_CONTRACT_ABI from 'abi/rariFundProxy.json';
import RARI_FUND_CONTROLLER_ETH_CONTRACT_ABI from 'abi/rariFundControllerEth.json';
import ERC20_CONTRACT_ABI from 'abi/erc20.json';
import RARI_FUND_TOKEN_CONTRACT_ABI from 'abi/rariFundToken.json';
import type { RariPool } from 'models/RariPool';
import type { Rates } from 'models/Asset';

const mapPools = (resultsArray: Object[]) => {
  return RARI_POOLS_ARRAY.reduce((result, pool, i) => {
    result[pool] = resultsArray[i];
    return result;
  }, {});
};

export const getRariFundBalanceInUSD = async (rates: Rates) => {
  const balancePerPool = await Promise.all(RARI_POOLS_ARRAY.map(async rariPool => {
    const rariContract = getContract(
      getRariPoolsEnv(rariPool).RARI_FUND_MANAGER_CONTRACT_ADDRESS,
      RARI_FUND_MANAGER_CONTRACT_ABI,
    );
    if (!rariContract) return EthersBigNumber.from(0);
    let balance = await rariContract.callStatic.getFundBalance()
      .catch((error) => {
        reportErrorLog("Rari service failed: Can't get Rari fund balance", { error });
        return EthersBigNumber.from(0);
      });
    if (rariPool === RARI_POOLS.ETH_POOL) {
      balance = EthersBigNumber.from(balance).mul(Math.floor(rates[ETH].USD * 1e9)).div(1e9);
    }
    return parseFloat(utils.formatUnits(balance, 18));
  }));
  return mapPools(balancePerPool);
};

export const getRariTokenTotalSupply = async () => {
  const supplyPerPool = await Promise.all(RARI_POOLS_ARRAY.map(async rariPool => {
    const rariContract = getContract(
      getRariPoolsEnv(rariPool).RARI_FUND_TOKEN_ADDRESS,
      RARI_FUND_TOKEN_CONTRACT_ABI,
    );
    if (!rariContract) return EthersBigNumber.from(0);
    const supply = await rariContract.totalSupply()
      .catch(error => {
        reportErrorLog("Rari service failed: Can't get Rari token supply", { error });
        return '0';
      });
    return parseFloat(utils.formatUnits(supply, 18));
  }));
  return mapPools(supplyPerPool);
};

export const getAccountDepositInUSDBN = async (rariPool: RariPool, accountAddress: string) => {
  const rariContract = getContract(
    getRariPoolsEnv(rariPool).RARI_FUND_MANAGER_CONTRACT_ADDRESS,
    RARI_FUND_MANAGER_CONTRACT_ABI,
  );
  if (!rariContract) return EthersBigNumber.from(0);
  const balanceBN = await rariContract.callStatic.balanceOf(accountAddress)
    .catch((error) => {
      reportErrorLog("Rari service failed: Can't get user account deposit in USD", { error });
      return EthersBigNumber.from(0);
    });
  return balanceBN;
};

export const getAccountDepositInUSD = async (accountAddress: string) => {
  const depositPerPool = await Promise.all(RARI_POOLS_ARRAY.map(async (rariPool) => {
    const balanceBN = await getAccountDepositInUSDBN(rariPool, accountAddress);
    return parseFloat(utils.formatUnits(balanceBN, 18));
  }));
  return mapPools(depositPerPool);
};

export const getAccountDepositInPoolToken = async (accountAddress: string) => {
  const depositPerPool = await Promise.all(RARI_POOLS_ARRAY.map(async (rariPool) => {
    const rariContract = getContract(
      getRariPoolsEnv(rariPool).RARI_FUND_TOKEN_ADDRESS,
      ERC20_CONTRACT_ABI,
    );
    if (!rariContract) return 0;
    const balanceBN = await rariContract.balanceOf(accountAddress)
      .catch((error) => {
        reportErrorLog("Rari service failed: Can't get user account deposit in RSPT", { error });
        return 0;
      });
    return parseFloat(utils.formatUnits(balanceBN, 18));
  }));
  return mapPools(depositPerPool);
};

export const getUserInterests = async (accountAddress: string) => {
  const userBalanceUSD = await getAccountDepositInUSD(accountAddress);
  const userBalanceInPoolToken = await getAccountDepositInPoolToken(accountAddress);

  const interestsPerPool = await Promise.all(RARI_POOLS_ARRAY.map(async (rariPool) => {
    if (!userBalanceInPoolToken[rariPool] || !userBalanceUSD[rariPool]) return null;

    /* eslint-disable i18next/no-literal-string */
    const query = `{
    transfersOut: transfers(where: {
      from: "${accountAddress}", 
      tokenAddress: "${getRariPoolsEnv(rariPool).RARI_FUND_TOKEN_ADDRESS}"
    }) {
      amount
      amountInUSD
      timestamp
    }
    transfersIn: transfers(where: {
      to: "${accountAddress}", 
      tokenAddress: "${getRariPoolsEnv(rariPool).RARI_FUND_TOKEN_ADDRESS}"
    }) {
      amount
      amountInUSD
      timestamp
    }
  }
  `;
    /* eslint-enable i18next/no-literal-string */
    const transactions = await callSubgraph(getEnv().RARI_SUBGRAPH_NAME, query);
    if (!transactions) return null;

    // From Rari docs:
    // "Get my interest accrued: Subtract total deposits and transfers in (in USD) and add total withdrawals
    // and transfers out (in USD) from uint256 RariFundManager.balanceOf(address account)."
    //
    // But in order to calculate the interest percentage we "reset" the interests gained on the last transfer
    // Aave calculates interest in the same way

    const lastTransfer = maxBy([...transactions.transfersIn, ...transactions.transfersOut], tx => +tx.timestamp);
    if (!lastTransfer) return null;
    const rsptExchangeRateOnLastTransfer = lastTransfer.amountInUSD / lastTransfer.amount;
    const initialBalance = userBalanceInPoolToken[rariPool] * rsptExchangeRateOnLastTransfer;
    const interests = userBalanceUSD[rariPool] - initialBalance;
    const interestsPercentage = (interests / initialBalance) * 100;
    return { interests, interestsPercentage };
  }));
  return mapPools(interestsPerPool);
};

// stable pool and yield pool are very similar
const getStablecoinPoolAPY = async (rariPool: RariPool, servicesApys: Object[]) => {
  const [dydxApyBNs, compoundApyBNs, aaveApyBNs, mstableApyBNs] = servicesApys;
  if (!dydxApyBNs || !compoundApyBNs || !aaveApyBNs || !mstableApyBNs) {
    return 0;
  }

  const rariContract = getContract(
    getRariPoolsEnv(rariPool).RARI_FUND_PROXY_CONTRACT_ADDRESS,
    RARI_FUND_PROXY_CONTRACT_ABI,
  );

  if (!rariContract) return 0;

  const balancesAndPrices = await rariContract.callStatic.getRawFundBalancesAndPrices()
    .catch((error) => {
      reportErrorLog("Rari service failed: Can't get fund balances and prices", { error });
      return null;
    });

  if (!balancesAndPrices) return 0;

  const [
    currencyCodes,
    fundControllerContractBalances,
    poolIndexes,
    poolIndexesBalances,
    pricesInUSD,
  ] = balancesAndPrices;

  const factors = [];
  let totalBalanceUsdBN = EthersBigNumber.from(0);

  for (let i = 0; i < currencyCodes.length; i++) {
    const currencyCode = currencyCodes[i];
    const priceInUsdBN = EthersBigNumber.from(pricesInUSD[i]);
    const contractBalanceBN = EthersBigNumber.from(fundControllerContractBalances[i]);
    const scale = EthersBigNumber.from(10).pow(RARI_TOKENS[currencyCode].decimals);
    const contractBalanceUsdBN = contractBalanceBN.mul(priceInUsdBN).div(scale);
    factors.push([contractBalanceUsdBN, EthersBigNumber.from(0)]);
    totalBalanceUsdBN = totalBalanceUsdBN.add(contractBalanceUsdBN);
    const pools = poolIndexes[i];
    const poolBalances = poolIndexesBalances[i];

    for (let j = 0; j < pools.length; j++) {
      const pool = pools[j];
      const poolBalanceBN = EthersBigNumber.from(poolBalances[j]);
      const poolBalanceUsdBN = poolBalanceBN.mul(priceInUsdBN).div(scale);
      let apyBN = EthersBigNumber.from(0);
      if (pool === 3) {
        apyBN = mstableApyBNs[currencyCode];
      } else if (pool === 2) {
        apyBN = aaveApyBNs[currencyCode];
      } else if (pool === 1) {
        apyBN = compoundApyBNs[currencyCode];
      } else if (pool === 0) {
        apyBN = dydxApyBNs[currencyCode];
      }
      if (apyBN) {
        factors.push([poolBalanceUsdBN, apyBN]);
        totalBalanceUsdBN = totalBalanceUsdBN.add(poolBalanceUsdBN);
      }
    }
  }

  if (totalBalanceUsdBN.isZero()) {
    let maxApyBN = EthersBigNumber.from(0);

    factors.forEach(factor => {
      const apyBN = factor[1];
      if (apyBN.gt(maxApyBN)) {
        maxApyBN = apyBN;
      }
    });
    return parseFloat(maxApyBN.toString()) / 1e16;
  }

  let apyBN = EthersBigNumber.from(0);
  for (let i = 0; i < factors.length; i++) {
    apyBN = apyBN.add(factors[i][0].mul(factors[i][1]).div(totalBalanceUsdBN));
  }
  return parseFloat(apyBN.toString()) / 1e16;
};

// ETH pool has slightly different contracts
const getEthPoolAPY = async (servicesApys: Object[]) => {
  const [dydxApyBNs, compoundApyBNs, aaveApyBNs] = servicesApys;
  if (!dydxApyBNs || !compoundApyBNs || !aaveApyBNs) {
    return 0;
  }

  const rariContract = getContract(
    getRariPoolsEnv(RARI_POOLS.ETH_POOL).RARI_FUND_CONTROLLER_CONTRACT_ADDRESS,
    RARI_FUND_CONTROLLER_ETH_CONTRACT_ABI,
  );

  if (!rariContract) return 0;

  const allBalances = await rariContract.callStatic.getRawFundBalances();

  const factors = [];
  let totalBalanceBN = EthersBigNumber.from(0);
  const contractBalanceBN = EthersBigNumber.from(allBalances['0']);
  factors.push([contractBalanceBN, EthersBigNumber.from(0)]);
  totalBalanceBN = totalBalanceBN.add(contractBalanceBN);
  const pools = allBalances['1'];
  const poolBalances = allBalances['2'];

  for (let i = 0; i < pools.length; i++) {
    const pool = pools[i];
    const poolBalanceBN = EthersBigNumber.from(poolBalances[i]);
    let poolAPY = EthersBigNumber.from(0);
    if (pool === 0) {
      poolAPY = dydxApyBNs.ETH;
    } else if (pool === 1) {
      poolAPY = compoundApyBNs.ETH;
    } else if (pool === 2) {
      poolAPY = EthersBigNumber.from(0);
    } else if (pool === 3) {
      poolAPY = aaveApyBNs.ETH;
    }
    factors.push([poolBalanceBN, poolAPY]);
    totalBalanceBN = totalBalanceBN.add(poolBalanceBN);
  }

  // If balance = 0, choose the maximum
  if (totalBalanceBN.isZero()) {
    let maxApyBN = EthersBigNumber.from(0);
    factors.forEach(factor => {
      const apyBN = factor[1];
      if (apyBN.gt(maxApyBN)) {
        maxApyBN = apyBN;
      }
    });
    return maxApyBN;
  }
  // If balance > 0, calculate the APY using the factors
  let apyBN = EthersBigNumber.from(0);
  for (let i = 0; i < factors.length; i++) {
    apyBN = apyBN.add(factors[i][0].mul(factors[i][1]).div(totalBalanceBN));
  }
  return parseFloat(apyBN.toString()) / 1e16;
};

// APY calculations taken from the official Rari dApp: https://github.com/Rari-Capital/rari-dApp
export const getRariAPY = async () => {
  const servicesApysArray = await Promise.all([
    getDydxApyBNs(),
    getCompoundApyBNs(),
    getAaveApyBNs(),
    getMStableApyBN(),
  ]);

  const apys = await Promise.all(RARI_POOLS_ARRAY.map(async (rariPool) => {
    if (rariPool === RARI_POOLS.ETH_POOL) {
      return getEthPoolAPY(servicesApysArray);
    }
    return getStablecoinPoolAPY(rariPool, servicesApysArray);
  }));
  return mapPools(apys);
};
