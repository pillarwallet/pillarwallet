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
import { ETH } from 'constants/assetsConstants';
import { buildERC20ApproveTransactionData, encodeContractMethod, getContract } from 'services/assets';
import { callSubgraph } from 'services/theGraph';
import { parseTokenBigNumberAmount } from 'utils/common';
import {
  ADDRESSES,
  getDeadline,
} from 'utils/uniswap';
import ERC20_CONTRACT_ABI from 'abi/erc20.json';
import UNISWAP_ROUTER_ABI from 'abi/uniswapRouter.json';
import type { Asset } from 'models/Asset';


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
        token0Price
        token1Price
        volumeUSD
        reserve0
        reserve1
        totalSupply
      }
    }
  `;
  /* eslint-enable i18next/no-literal-string */
  return callSubgraph(getEnv().UNISWAP_SUBGRAPH_NAME, query);
};

export const getAddLiquidityEthTransactions = async (
  sender: string,
  tokenAmount: number,
  tokenAsset: Asset,
  ethAmount: number,
  txFeeInWei?: BigNumber,
): Promise<Object[]> => {
  const tokenAmountBN = parseTokenBigNumberAmount(tokenAmount, tokenAsset.decimals);
  const deadline = getDeadline();

  const addLiquidityTransactionData = encodeContractMethod(UNISWAP_ROUTER_ABI, 'addLiquidityETH', [
    tokenAsset.address,
    tokenAmountBN,
    0,
    0,
    sender,
    deadline,
  ]);

  let addLiquidityTransactions = [{
    from: sender,
    to: ADDRESSES.router,
    data: addLiquidityTransactionData,
    amount: parseFloat(ethAmount),
    symbol: ETH,
  }];

  const erc20Contract = getContract(tokenAsset.address, ERC20_CONTRACT_ABI);
  const approvedAmountBN = erc20Contract
    ? await erc20Contract.allowance(sender, ADDRESSES.router)
    : null;

  if (!approvedAmountBN || tokenAmountBN.gt(approvedAmountBN)) {
    const approveTransactionData = buildERC20ApproveTransactionData(ADDRESSES.router, tokenAmount, tokenAsset.decimals);
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
  addLiquidityTransactions[0] = {
    ...addLiquidityTransactions[0],
    txFeeInWei,
  };

  return addLiquidityTransactions;
};

export const getRemoveLiquidityEthTransactions = async (
  sender: string,
  poolTokenAmount: number,
  poolToken: Asset,
  erc20Token: Asset,
  txFeeInWei?: BigNumber,
): Promise<Object[]> => {
  const tokenAmountBN = parseTokenBigNumberAmount(poolTokenAmount, poolToken.decimals);
  const deadline = getDeadline();

  const removeLiquidityTransactionData = encodeContractMethod(UNISWAP_ROUTER_ABI, 'removeLiquidityETH', [
    erc20Token.address,
    tokenAmountBN,
    0,
    0,
    sender,
    deadline,
  ]);

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
