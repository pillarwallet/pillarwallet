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
import { buildERC20ApproveTransactionData, encodeContractMethod, getContract } from 'services/assets';
import { callSubgraph } from 'services/theGraph';
import { parseTokenBigNumberAmount } from 'utils/common';
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
import type { LiquidityPoolsReducerState } from 'reducers/liquidityPoolsReducer';

export const fetchPoolData = async (poolAddress: string): Promise<Object> => {
  /* eslint-disable i18next/no-literal-string */
  const query = `
    {
      pair(
        id: "${poolAddress}"
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
        where: { pairAddress: "${poolAddress}" },
        orderBy: date,
        orderDirection: desc,
      ) {
        date
        reserveUSD
        totalSupply
        dailyVolumeUSD
      }
    }
  `;
  /* eslint-enable i18next/no-literal-string */
  return callSubgraph(getEnv().UNISWAP_SUBGRAPH_NAME, query);
};

export const getAddLiquidityTransactions = async (
  sender: string,
  pool: LiquidityPool,
  tokenAmounts: number[],
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
    txFeeInWei,
  };

  return addLiquidityTransactions;
};

export const getRemoveLiquidityTransactions = async (
  sender: string,
  poolTokenAmount: number,
  poolToken: Asset,
  tokensAssets: Asset[],
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
    txFeeInWei,
  };

  return removeLiquidityTransactions;
};

export const getStakeTransactions = (
  pool: LiquidityPool,
  sender: string,
  amount: number,
  token: Asset,
  txFeeInWei?: BigNumber,
): Promise<Object[]> => {
  return getUnipoolStakeTransactions(pool.unipoolAddress, sender, amount, token, txFeeInWei);
};

export const getUnstakeTransaction = (
  pool: LiquidityPool,
  sender: string,
  amount: number,
  txFeeInWei?: BigNumber,
) => {
  return getUnipoolUnstakeTransaction(pool.unipoolAddress, sender, amount, txFeeInWei);
};

export const getClaimRewardsTransaction = (
  pool: LiquidityPool,
  sender: string,
  txFeeInWei?: BigNumber,
) => {
  return getUnipoolClaimRewardsTransaction(pool.unipoolAddress, sender, txFeeInWei);
};

export const getPoolStats = (
  pool: LiquidityPool,
  liquidityPoolsReducer: LiquidityPoolsReducerState,
): LiquidityPoolStats => {
  const poolAddress = pool.uniswapPairAddress;
  const poolData = liquidityPoolsReducer.poolsData[poolAddress];
  const pairData = poolData.pair;
  const historyData = poolData.pairDayDatas;

  const currentPrice = pairData.reserveUSD / pairData.totalSupply;
  const dayAgoPrice = historyData[1].reserveUSD / historyData[1].totalSupply;
  const dayPriceChange = ((currentPrice - dayAgoPrice) * 100) / dayAgoPrice;
  const weekAgoPrice = historyData[7].reserveUSD / historyData[7].totalSupply;
  const weekPriceChange = ((currentPrice - weekAgoPrice) * 100) / weekAgoPrice;
  const monthAgoPrice = historyData[30].reserveUSD / historyData[30].totalSupply;
  const monthPriceChange = ((currentPrice - monthAgoPrice) * 100) / monthAgoPrice;

  const tokenSymbols = [pairData.token0.symbol, pairData.token1.symbol]
    .map(symbol => symbol === WETH ? ETH : symbol);

  const tokensLiquidity = {
    [tokenSymbols[0]]: pairData.reserve0,
    [tokenSymbols[1]]: pairData.reserve1,
  };
  const tokensPricesUSD = {
    [tokenSymbols[0]]: pairData.reserveUSD / (2 * pairData.reserve0),
    [tokenSymbols[1]]: pairData.reserveUSD / (2 * pairData.reserve1),
  };
  const tokensPrices = {
    [tokenSymbols[0]]: pairData.token0Price,
    [tokenSymbols[1]]: pairData.token1Price,
  };
  const tokensPerLiquidityToken = {
    [tokenSymbols[0]]: pairData.reserve0 / pairData.totalSupply,
    [tokenSymbols[1]]: pairData.reserve1 / pairData.totalSupply,
  };

  const { unipoolAddress } = pool;
  const unipoolData = liquidityPoolsReducer.unipoolData[unipoolAddress];

  return {
    currentPrice,
    dayPriceChange,
    weekPriceChange,
    monthPriceChange,
    volume: pairData.volumeUSD,
    totalLiquidity: pairData.reserveUSD,
    dailyVolume: historyData[0].dailyVolumeUSD,
    tokensLiquidity,
    stakedAmount: unipoolData.stakedAmount,
    rewardsToClaim: unipoolData.earnedAmount,
    tokensPricesUSD,
    tokensPrices,
    tokensPerLiquidityToken,
    totalSupply: pairData.totalSupply,
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
