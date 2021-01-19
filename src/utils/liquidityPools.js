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
import { BigNumber } from 'bignumber.js';
import { getEnv } from 'configs/envConfig';
import { ETH, WETH } from 'constants/assetsConstants';
import {
  LIQUIDITY_POOLS_ADD_LIQUIDITY_TRANSACTION,
  LIQUIDITY_POOLS_REMOVE_LIQUIDITY_TRANSACTION,
  LIQUIDITY_POOLS_STAKE_TRANSACTION,
  LIQUIDITY_POOLS_UNSTAKE_TRANSACTION,
  LIQUIDITY_POOLS_REWARDS_CLAIM_TRANSACTION,
  LIQUIDITY_POOLS,
  UNISWAP_FEE_RATE,
} from 'constants/liquidityPoolsConstants';
import { buildERC20ApproveTransactionData, encodeContractMethod, getContract } from 'services/assets';
import { callSubgraph } from 'services/theGraph';
import { parseTokenBigNumberAmount, formatUnits } from 'utils/common';
import { addressesEqual } from 'utils/assets';
import {
  getStakeTransactions as getUnipoolStakeTransactions,
  getUnstakeTransaction as getUnipoolUnstakeTransaction,
  getClaimRewardsTransaction as getUnipoolClaimRewardsTransaction,
} from 'utils/unipool';
import {
  ADDRESSES,
  getDeadline,
} from 'utils/uniswap';
import ERC20_CONTRACT_ABI from 'abi/erc20.json';
import UNISWAP_ROUTER_ABI from 'abi/uniswapRouter.json';
import type { Asset } from 'models/Asset';
import type { LiquidityPool, LiquidityPoolStats } from 'models/LiquidityPools';
import type { Transaction } from 'models/Transaction';
import type { LiquidityPoolsReducerState } from 'reducers/liquidityPoolsReducer';

export const fetchPoolData = async (poolAddress: string, userAddress: string): Promise<Object> => {
  /* eslint-disable i18next/no-literal-string */
  const query = `
    {
      pair(
        id: "${poolAddress.toLowerCase()}"
      ) {
        id 
        token0 {
          id
          name
          symbol
        }
        token1 {
          id
          name
          symbol
        }
        reserve0
        reserve1
        totalSupply
        reserveETH
        reserveUSD
        token0Price
        token1Price
        volumeToken0
        volumeToken1
        volumeUSD
      }
      pairDayDatas(
        where: { pairAddress: "${poolAddress.toLowerCase()}" },
        orderBy: date,
        orderDirection: desc,
      ) {
        date
        reserveUSD
        totalSupply
        dailyVolumeUSD
      }
      pairHourDatas(
        where: {
          hourStartUnix_gt: ${Math.floor(Date.now() / 1000) - (24 * 60 * 60)}, 
          pair: "${poolAddress.toLowerCase()}",
        }
      ) {
        hourlyVolumeUSD
      }
      liquidityPosition(id: "${poolAddress.toLowerCase()}-${userAddress.toLowerCase()}") {
        liquidityTokenBalance
      }
    }
  `;
  /* eslint-enable i18next/no-literal-string */
  return callSubgraph(getEnv().UNISWAP_SUBGRAPH_NAME, query);
};

export const getAddLiquidityTransactions = async (
  sender: string,
  pool: LiquidityPool,
  tokenAmounts: string[],
  poolTokenAmount: string,
  tokensAssets: Asset[],
  txFeeInWei?: BigNumber,
): Promise<Object[]> => {
  const deadline = getDeadline();
  let addLiquidityTransactions = [];

  const addApproveTransaction = async (tokenAmount, tokenAmountBN, tokenAsset) => {
    const erc20Contract = getContract(tokenAsset.address, ERC20_CONTRACT_ABI);
    const approvedAmountBN = erc20Contract
      ? await erc20Contract.allowance(sender, ADDRESSES.router)
      : null;

    if (!approvedAmountBN || tokenAmountBN.gt(approvedAmountBN)) {
      const approveTransactionData =
        buildERC20ApproveTransactionData(ADDRESSES.router, tokenAmount, tokenAsset.decimals);
      addLiquidityTransactions = [
        {
          from: sender,
          to: tokenAsset.address,
          data: approveTransactionData,
          amount: 0,
          symbol: ETH,
        },
        ...addLiquidityTransactions,
      ];
    }
  };

  if (tokensAssets.find(({ symbol }) => symbol === ETH)) {
    const erc20TokenIndex = tokensAssets.findIndex(({ symbol }) => symbol !== ETH);
    const erc20TokenAmount = tokenAmounts[erc20TokenIndex];
    const erc20TokenData = tokensAssets[erc20TokenIndex];
    const ethAmount = tokenAmounts[tokensAssets.findIndex(({ symbol }) => symbol === ETH)];

    const erc20TokenAmountBN = parseTokenBigNumberAmount(erc20TokenAmount, erc20TokenData.decimals);

    const addLiquidityTransactionData = encodeContractMethod(UNISWAP_ROUTER_ABI, 'addLiquidityETH', [
      erc20TokenData.address,
      erc20TokenAmountBN,
      0,
      0,
      sender,
      deadline,
    ]);

    addLiquidityTransactions = [{
      from: sender,
      to: ADDRESSES.router,
      data: addLiquidityTransactionData,
      amount: parseFloat(ethAmount),
      symbol: ETH,
    }];
    await addApproveTransaction(erc20TokenAmount, erc20TokenAmountBN, erc20TokenData);
  } else {
    const tokenAmountsBN = tokensAssets.map((token, i) => parseTokenBigNumberAmount(tokenAmounts[i], token.decimals));
    const addLiquidityTransactionData = encodeContractMethod(UNISWAP_ROUTER_ABI, 'addLiquidity', [
      tokensAssets[0].address,
      tokensAssets[1].address,
      tokenAmountsBN[0],
      tokenAmountsBN[1],
      0,
      0,
      sender,
      deadline,
    ]);
    addLiquidityTransactions = [{
      from: sender,
      to: ADDRESSES.router,
      data: addLiquidityTransactionData,
      amount: 0,
      symbol: ETH,
    }];
    await addApproveTransaction(tokenAmounts[0], tokenAmountsBN[0], tokensAssets[0]);
    await addApproveTransaction(tokenAmounts[1], tokenAmountsBN[1], tokensAssets[1]);
  }

  addLiquidityTransactions[0] = {
    ...addLiquidityTransactions[0],
    tag: LIQUIDITY_POOLS_ADD_LIQUIDITY_TRANSACTION,
    extra: {
      amount: poolTokenAmount,
      pool,
      tokenAmounts,
    },
    txFeeInWei,
  };

  return addLiquidityTransactions;
};

export const getRemoveLiquidityTransactions = async (
  sender: string,
  pool: LiquidityPool,
  poolTokenAmount: string,
  poolToken: Asset,
  tokensAssets: Asset[],
  obtainedTokensAmounts: string[],
  txFeeInWei?: BigNumber,
): Promise<Object[]> => {
  const tokenAmountBN = parseTokenBigNumberAmount(poolTokenAmount, poolToken.decimals);
  const deadline = getDeadline();

  let removeLiquidityTransactionData;

  if (tokensAssets.find(({ symbol }) => symbol === ETH)) {
    const erc20TokenIndex = tokensAssets.findIndex(({ symbol }) => symbol !== ETH);
    const erc20TokenData = tokensAssets[erc20TokenIndex];
    removeLiquidityTransactionData = encodeContractMethod(UNISWAP_ROUTER_ABI, 'removeLiquidityETH', [
      erc20TokenData.address,
      tokenAmountBN,
      0,
      0,
      sender,
      deadline,
    ]);
  } else {
    removeLiquidityTransactionData = encodeContractMethod(UNISWAP_ROUTER_ABI, 'removeLiquidity', [
      tokensAssets[0].address,
      tokensAssets[1].address,
      tokenAmountBN,
      0,
      0,
      sender,
      deadline,
    ]);
  }

  let removeLiquidityTransactions = [{
    from: sender,
    to: ADDRESSES.router,
    data: removeLiquidityTransactionData,
    amount: 0,
    symbol: ETH,
  }];

  const erc20Contract = getContract(poolToken.address, ERC20_CONTRACT_ABI);
  const approvedAmountBN = erc20Contract
    ? await erc20Contract.allowance(sender, ADDRESSES.router)
    : null;

  if (!approvedAmountBN || tokenAmountBN.gt(approvedAmountBN)) {
    const approveTransactionData = buildERC20ApproveTransactionData(
      ADDRESSES.router, poolTokenAmount, poolToken.decimals);
    removeLiquidityTransactions = [
      {
        from: sender,
        to: poolToken.address,
        data: approveTransactionData,
        amount: 0,
        symbol: ETH,
      },
      ...removeLiquidityTransactions,
    ];
  }
  removeLiquidityTransactions[0] = {
    ...removeLiquidityTransactions[0],
    tag: LIQUIDITY_POOLS_REMOVE_LIQUIDITY_TRANSACTION,
    extra: {
      amount: poolTokenAmount,
      pool,
      tokenAmounts: obtainedTokensAmounts,
    },
    txFeeInWei,
  };

  return removeLiquidityTransactions;
};

export const getStakeTransactions = async (
  pool: LiquidityPool,
  sender: string,
  amount: string,
  token: Asset,
  txFeeInWei?: BigNumber,
): Promise<Object[]> => {
  const stakeTransactions = await getUnipoolStakeTransactions(pool.unipoolAddress, sender, amount, token);
  stakeTransactions[0] = {
    ...stakeTransactions[0],
    tag: LIQUIDITY_POOLS_STAKE_TRANSACTION,
    extra: {
      amount,
      pool,
    },
    txFeeInWei,
  };
  return stakeTransactions;
};

export const getUnstakeTransaction = (
  pool: LiquidityPool,
  sender: string,
  amount: string,
  txFeeInWei?: BigNumber,
) => {
  let unstakeTransaction = getUnipoolUnstakeTransaction(pool.unipoolAddress, sender, amount);
  unstakeTransaction = {
    ...unstakeTransaction,
    tag: LIQUIDITY_POOLS_UNSTAKE_TRANSACTION,
    extra: {
      amount,
      pool,
    },
    txFeeInWei,
  };
  return unstakeTransaction;
};

export const getClaimRewardsTransaction = (
  pool: LiquidityPool,
  sender: string,
  amountToClaim: number,
  txFeeInWei?: BigNumber,
) => {
  let claimRewardsTransaction = getUnipoolClaimRewardsTransaction(pool.unipoolAddress, sender);
  claimRewardsTransaction = {
    ...claimRewardsTransaction,
    tag: LIQUIDITY_POOLS_REWARDS_CLAIM_TRANSACTION,
    extra: {
      pool,
      amount: amountToClaim,
    },
    txFeeInWei,
  };
  return claimRewardsTransaction;
};

export const getPoolStats = (
  pool: LiquidityPool,
  liquidityPoolsReducer: LiquidityPoolsReducerState,
): ?LiquidityPoolStats => {
  const poolAddress = pool.uniswapPairAddress;
  const poolData = liquidityPoolsReducer.poolsData[poolAddress];
  if (!poolData) return null;
  const pairData = poolData.pair;
  const historyData = poolData.pairDayDatas;
  const hourlyData = poolData.pairHourDatas;
  if (!pairData || !historyData || !hourlyData) return null;
  const currentPrice = pairData.reserveUSD / pairData.totalSupply;
  const dayAgoPrice = historyData[1] && historyData[1].reserveUSD / historyData[1].totalSupply;
  const dayPriceChange = dayAgoPrice && ((currentPrice - dayAgoPrice) * 100) / dayAgoPrice;
  const weekAgoPrice = historyData[7] && historyData[7].reserveUSD / historyData[7].totalSupply;
  const weekPriceChange = weekAgoPrice && ((currentPrice - weekAgoPrice) * 100) / weekAgoPrice;
  const monthAgoPrice = historyData[30] && historyData[30].reserveUSD / historyData[30].totalSupply;
  const monthPriceChange = monthAgoPrice && ((currentPrice - monthAgoPrice) * 100) / monthAgoPrice;

  // $FlowFixMe: flow update to 0.122
  const tokenSymbols: [string, string] = [pairData.token0.symbol, pairData.token1.symbol]
    .map(symbol => symbol === WETH ? ETH : symbol);

  const tokensLiquidity = {
    [tokenSymbols[0]]: parseFloat(pairData.reserve0),
    [tokenSymbols[1]]: parseFloat(pairData.reserve1),
  };
  const tokensPricesUSD = {
    [tokenSymbols[0]]: pairData.reserveUSD / (2 * pairData.reserve0),
    [tokenSymbols[1]]: pairData.reserveUSD / (2 * pairData.reserve1),
  };
  const tokensPrices = {
    [tokenSymbols[0]]: parseFloat(pairData.token0Price),
    [tokenSymbols[1]]: parseFloat(pairData.token1Price),
  };
  const tokensPerLiquidityToken = {
    [tokenSymbols[0]]: pairData.reserve0 / pairData.totalSupply,
    [tokenSymbols[1]]: pairData.reserve1 / pairData.totalSupply,
  };

  const { unipoolAddress } = pool;
  const unipoolData = liquidityPoolsReducer.unipoolData[unipoolAddress];

  const history = historyData.map(dataPoint => ({
    date: new Date(dataPoint.date * 1000),
    value: dataPoint.totalSupply === 0 ? 0 : dataPoint.reserveUSD / dataPoint.totalSupply,
  }));

  history.reverse();

  history.push({
    date: new Date(),
    value: currentPrice,
  });

  const dailyVolume = hourlyData.reduce((sum, { hourlyVolumeUSD }) => sum + parseFloat(hourlyVolumeUSD), 0);

  return {
    currentPrice,
    dayPriceChange,
    weekPriceChange,
    monthPriceChange,
    volume: parseFloat(pairData.volumeUSD),
    totalLiquidity: parseFloat(pairData.reserveUSD),
    dailyVolume,
    dailyFees: dailyVolume * UNISWAP_FEE_RATE,
    tokensLiquidity,
    stakedAmount: parseFloat(unipoolData?.stakedAmount) || 0,
    rewardsToClaim: parseFloat(unipoolData?.earnedAmount) || 0,
    tokensPricesUSD,
    tokensPrices,
    tokensPerLiquidityToken,
    totalSupply: parseFloat(pairData.totalSupply),
    history,
    userLiquidityTokenBalance: parseFloat(poolData.liquidityPosition?.liquidityTokenBalance) || 0,
  };
};

export const getShareOfPool = (
  pool: LiquidityPool,
  tokenAmounts: number[],
  liquidityPoolsReducer: LiquidityPoolsReducerState,
): number => {
  const poolAddress = pool.uniswapPairAddress;
  const poolData = liquidityPoolsReducer.poolsData[poolAddress];
  const pairData = poolData.pair;
  return (tokenAmounts[0] / parseFloat(pairData.reserve0)) * 100;
};

// given the pool and amount of one of the assets (to add or receive) it calculates the amount of the rest of the assets
// user should add to the pool or receive
// the last token index is the token to be received
export const calculateProportionalAssetValues = (
  pool: LiquidityPool,
  tokenAmount: number,
  tokenIndex: number,
  liquidityPoolsReducer: LiquidityPoolsReducerState,
): number[] => {
  const poolAddress = pool.uniswapPairAddress;
  const poolData = liquidityPoolsReducer.poolsData[poolAddress];
  const pairData = poolData.pair;
  const totalAmount = parseFloat(pairData.totalSupply);
  const token0Pool = parseFloat(pairData.reserve0);
  const token1Pool = parseFloat(pairData.reserve1);
  let token0Deposited;
  let token1Deposited;
  if (tokenIndex === 1) {
    token1Deposited = tokenAmount;
    token0Deposited = (token1Deposited * token0Pool) / token1Pool;
  } else {
    token0Deposited = tokenAmount;
    token1Deposited = (token0Deposited * token1Pool) / token0Pool;
  }
  const amountMinted = (totalAmount * token0Deposited) / token0Pool;
  return [token0Deposited, token1Deposited, amountMinted];
};

// the same as above, but for removing liquidity
export const calculateProportionalRemoveLiquidityAssetValues = (
  pool: LiquidityPool,
  tokenAmount: number,
  tokenIndex: number,
  liquidityPoolsReducer: LiquidityPoolsReducerState,
): number[] => {
  const poolAddress = pool.uniswapPairAddress;
  const poolData = liquidityPoolsReducer.poolsData[poolAddress];
  const pairData = poolData.pair;

  const totalAmount = parseFloat(pairData.totalSupply);
  const token0Pool = parseFloat(pairData.reserve0);
  const token1Pool = parseFloat(pairData.reserve1);
  let token0Withdrawn;
  let token1Withdrawn;
  let poolTokenBurned;

  if (tokenIndex === 0) {
    token0Withdrawn = tokenAmount;
    poolTokenBurned = (token0Withdrawn * totalAmount) / token0Pool;
    token1Withdrawn = (token1Pool * poolTokenBurned) / totalAmount;
  } else if (tokenIndex === 1) {
    token1Withdrawn = tokenAmount;
    poolTokenBurned = (token1Withdrawn * totalAmount) / token1Pool;
    token0Withdrawn = (token0Pool * poolTokenBurned) / totalAmount;
  } else {
    poolTokenBurned = tokenAmount;
    token0Withdrawn = (token0Pool * poolTokenBurned) / totalAmount;
    token1Withdrawn = (token1Pool * poolTokenBurned) / totalAmount;
  }
  return [token0Withdrawn, token1Withdrawn, poolTokenBurned];
};

export const isLiquidityPoolsTransactionTag = (txTag: ?string) => {
  return [
    LIQUIDITY_POOLS_ADD_LIQUIDITY_TRANSACTION,
    LIQUIDITY_POOLS_REMOVE_LIQUIDITY_TRANSACTION,
    LIQUIDITY_POOLS_STAKE_TRANSACTION,
    LIQUIDITY_POOLS_UNSTAKE_TRANSACTION,
    LIQUIDITY_POOLS_REWARDS_CLAIM_TRANSACTION,
  ].includes(txTag);
};

const buildUnipoolTransaction = (
  accountAddress,
  transaction,
  unipoolTransactions,
  liquidityPool,
) => {
  const { rewardClaims = [], stakes = [], unstakes = [] } = unipoolTransactions;
  const txHash = transaction.hash.toLowerCase();

  const rewardClaimTransaction = rewardClaims.find(({ id }) => id === txHash);
  if (rewardClaimTransaction) {
    return {
      ...transaction,
      tag: LIQUIDITY_POOLS_REWARDS_CLAIM_TRANSACTION,
      extra: {
        amount: formatUnits(rewardClaimTransaction.reward, 18),
        pool: liquidityPool,
      },
    };
  }
  const stakeTransaction = stakes.find(({ id }) => id === txHash);
  if (stakeTransaction) {
    return {
      ...transaction,
      tag: LIQUIDITY_POOLS_STAKE_TRANSACTION,
      extra: {
        amount: formatUnits(stakeTransaction.amount, 18),
        pool: liquidityPool,
      },
    };
  }
  const unstakeTransaction = unstakes.find(({ id }) => id === txHash);
  if (unstakeTransaction) {
    return {
      ...transaction,
      tag: LIQUIDITY_POOLS_UNSTAKE_TRANSACTION,
      extra: {
        amount: formatUnits(unstakeTransaction.amount, 18),
        pool: liquidityPool,
      },
    };
  }
  return transaction;
};

const mapTransactionsHistoryWithUnipool = async (
  accountAddress: string,
  transactionHistory: Transaction[],
) => {
  /* eslint-disable i18next/no-literal-string */
  const query = `{
    rewardClaims(where: {
      user: "${accountAddress}"
    }) {
      id
      reward
    }
    stakes(where: {
      user: "${accountAddress}"
    }) {
      id
      amount
    }
    unstakes(where: {
      user: "${accountAddress}"
    }) {
      id
      amount
    }
  }`;
  /* eslint-enable i18next/no-literal-string */

  const responses = await Promise.all(LIQUIDITY_POOLS().map(pool => callSubgraph(pool.unipoolSubgraphName, query)));
  const mappedHistory = transactionHistory.reduce((
    transactions,
    transaction,
    transactionIndex,
  ) => {
    const { to } = transaction;
    const liquidityPoolIndex = LIQUIDITY_POOLS().findIndex(pool => addressesEqual(pool.unipoolAddress, to));
    if (liquidityPoolIndex !== -1) {
      transactions[transactionIndex] = buildUnipoolTransaction(
        accountAddress,
        transaction,
        responses[liquidityPoolIndex],
        LIQUIDITY_POOLS()[liquidityPoolIndex],
      );
    }
    return transactions;
  }, transactionHistory);
  return mappedHistory;
};

const buildUniswapTransaction = (
  accountAddress,
  transaction,
  uniswapTransactions,
) => {
  const { mints = [], burns = [] } = uniswapTransactions;
  const txHash = transaction.hash.toLowerCase();

  const mintTransaction = mints.find(({ id }) => id.startsWith(txHash));
  if (mintTransaction) {
    const liquidityPool = LIQUIDITY_POOLS()
      .find(pool => addressesEqual(pool.uniswapPairAddress, mintTransaction.pair.id));
    if (!liquidityPool) return transaction;
    const { amount0, amount1, liquidity } = mintTransaction;
    return {
      ...transaction,
      tag: LIQUIDITY_POOLS_ADD_LIQUIDITY_TRANSACTION,
      extra: {
        amount: liquidity,
        pool: liquidityPool,
        tokenAmounts: [amount0, amount1],
      },
    };
  }

  const burnTransaction = burns.find(({ id }) => id.startsWith(txHash));
  if (burnTransaction) {
    const liquidityPool = LIQUIDITY_POOLS()
      .find(pool => addressesEqual(pool.uniswapPairAddress, burnTransaction.pair.id));
    if (!liquidityPool) return transaction;
    const { amount0, amount1, liquidity } = burnTransaction;
    return {
      ...transaction,
      tag: LIQUIDITY_POOLS_REMOVE_LIQUIDITY_TRANSACTION,
      extra: {
        amount: liquidity,
        pool: liquidityPool,
        tokenAmounts: [amount0, amount1],
      },
    };
  }

  return transaction;
};

const mapTransactionsHistoryWithUniswap = async (
  accountAddress: string,
  transactionHistory: Transaction[],
) => {
  /* eslint-disable i18next/no-literal-string */
  const query = `{
    mints(where: {
      to: "${accountAddress}"
    }) {
      id
      amount0
      amount1
      liquidity
      pair {
        id
      }
    }
    burns(where: {
      sender: "${accountAddress}"
    }) {
      id
      amount0
      amount1
      liquidity
      pair {
        id
      }
    }
  }`;
  /* eslint-enable i18next/no-literal-string */

  const response = await callSubgraph(getEnv().UNISWAP_SUBGRAPH_NAME, query) || {};
  const mappedHistory = transactionHistory.reduce((
    transactions,
    transaction,
    transactionIndex,
  ) => {
    const { to } = transaction;
    if (addressesEqual(ADDRESSES.router, to)) {
      transactions[transactionIndex] = buildUniswapTransaction(
        accountAddress,
        transaction,
        response,
      );
    }
    return transactions;
  }, transactionHistory);
  return mappedHistory;
};

export const mapTransactionsHistoryWithLiquidityPools = async (
  accountAddress: string,
  transactionHistory: Transaction[],
) => {
  transactionHistory = await mapTransactionsHistoryWithUnipool(accountAddress, transactionHistory);
  transactionHistory = await mapTransactionsHistoryWithUniswap(accountAddress, transactionHistory);
  return transactionHistory;
};
