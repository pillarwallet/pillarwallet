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
import { getEnv } from 'configs/envConfig';
import { reportErrorLog } from 'utils/common';
import RARI_FUND_MANAGER_CONTRACT_ABI from 'abi/rariFundManager.json';
import RARI_FUND_PROXY_CONTRACT_ABI from 'abi/rariFundProxy.json';
import ERC20_CONTRACT_ABI from 'abi/erc20.json';


export const getRariFundBalanceInUSD = async () => {
  const rariContract = getContract(
    getEnv().RARI_FUND_MANAGER_CONTRACT_ADDRESS,
    RARI_FUND_MANAGER_CONTRACT_ABI,
  );
  if (!rariContract) return 0;
  const balanceBN = await rariContract.callStatic.getFundBalance()
    .catch((error) => {
      reportErrorLog("Rari service failed: Can't get Rari fund balance", { error });
      return 0;
    });
  return parseFloat(utils.formatUnits(balanceBN, 18));
};

export const getAccountDepositInUSD = async (accountAddress: string) => {
  const rariContract = getContract(
    getEnv().RARI_FUND_MANAGER_CONTRACT_ADDRESS,
    RARI_FUND_MANAGER_CONTRACT_ABI,
  );
  if (!rariContract) return 0;
  const balanceBN = await rariContract.callStatic.balanceOf(accountAddress)
    .catch((error) => {
      reportErrorLog("Rari service failed: Can't get user account deposit in USD", { error });
      return 0;
    });
  return parseFloat(utils.formatUnits(balanceBN, 18));
};

export const getAccountDepositInRSPT = async (accountAddress: string) => {
  const rariContract = getContract(
    getEnv().RSPT_TOKEN_ADDRESS,
    ERC20_CONTRACT_ABI,
  );
  if (!rariContract) return 0;
  const balanceBN = await rariContract.balanceOf(accountAddress)
    .catch((error) => {
      reportErrorLog("Rari service failed: Can't get user account deposit in RSPT", { error });
      return 0;
    });
  return parseFloat(utils.formatUnits(balanceBN, 18));
};

export const getUserInterests = async (accountAddress: string) => {
  const userBalanceUSD = await getAccountDepositInUSD(accountAddress);
  const userBalanceRSPT = await getAccountDepositInRSPT(accountAddress);
  if (!userBalanceRSPT || !userBalanceUSD) return null;

  /* eslint-disable i18next/no-literal-string */
  const query = `{
    transfersOut: transfers(where: {from: "${accountAddress}"}) {
      amount
      amountInUSD
      timestamp
    }
    transfersIn: transfers(where: {to: "${accountAddress}"}) {
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
  const initialBalance = userBalanceRSPT * rsptExchangeRateOnLastTransfer;
  const interests = userBalanceUSD - initialBalance;
  const interestsPercentage = (interests / initialBalance) * 100;
  return { interests, interestsPercentage };
};

// APY calculations taken from the official Rari dApp: https://github.com/Rari-Capital/rari-dApp
export const getRariAPY = async () => {
  const tokens = {
    DAI: { decimals: 18 },
    USDC: { decimals: 6 },
    USDT: { decimals: 6 },
    TUSD: { decimals: 18 },
    BUSD: { decimals: 18 },
    sUSD: { decimals: 18 },
    mUSD: { decimals: 18 },
  };

  const rariContract = getContract(
    getEnv().RARI_FUND_PROXY_CONTRACT_ADDRESS,
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

  const [dydxApyBNs, compoundApyBNs, aaveApyBNs, mstableApyBNs] = await Promise.all([
    getDydxApyBNs(),
    getCompoundApyBNs(),
    getAaveApyBNs(),
    getMStableApyBN(),
  ]);

  if (!dydxApyBNs || !compoundApyBNs || !aaveApyBNs || !mstableApyBNs) return 0;

  const factors = [];
  let totalBalanceUsdBN = EthersBigNumber.from(0);

  for (let i = 0; i < currencyCodes.length; i++) {
    const currencyCode = currencyCodes[i];
    const priceInUsdBN = EthersBigNumber.from(pricesInUSD[i]);
    const contractBalanceBN = EthersBigNumber.from(fundControllerContractBalances[i]);
    const scale = EthersBigNumber.from(10).pow(tokens[currencyCode].decimals);
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
      } else {
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
