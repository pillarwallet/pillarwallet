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
import { Contract } from 'ethers';
import { utils as ptUtils } from 'pooltogetherjs';
import { getEnv } from 'configs/envConfig';

// constants
import { DAI } from 'constants/assetsConstants';
import { POOLTOGETHER_WITHDRAW_TRANSACTION, POOLTOGETHER_DEPOSIT_TRANSACTION } from 'constants/poolTogetherConstants';

// utils
import { getEthereumProvider } from 'utils/common';

// abi
import POOL_DAI_ABI from 'abi/poolDAI.json';
import POOL_USDC_ABI from 'abi/poolUSDC.json';
import DAI_ABI from 'abi/DAI.json';
import USDC_ABI from 'abi/USDC.json';

// services
import { callSubgraph } from './theGraph';


const DAI_DECIMALS = 18;
const USDC_DECIMALS = 6;

const getPoolNetwork = () => {
  return getEnv().NETWORK_PROVIDER === 'ropsten' ? 'kovan' : getEnv().NETWORK_PROVIDER;
};

const getPoolTogetherTokenContract = (symbol: string) => {
  const poolContractAddress =
    symbol === DAI ? getEnv().POOL_DAI_CONTRACT_ADDRESS : getEnv().POOL_USDC_CONTRACT_ADDRESS;
  const poolAbi = symbol === DAI ? POOL_DAI_ABI : POOL_USDC_ABI;
  const unitType = symbol === DAI ? DAI_DECIMALS : USDC_DECIMALS;
  const provider = getEthereumProvider(getPoolNetwork());
  const poolContract = new Contract(poolContractAddress, poolAbi, provider);

  const tokenContractAddress = symbol === DAI ? getEnv().DAI_ADDRESS : getEnv().USDC_ADDRESS;
  const tokenABI = symbol === DAI ? DAI_ABI : USDC_ABI;
  const tokenContract = new Contract(tokenContractAddress, tokenABI, provider);

  return {
    poolContract,
    poolContractAddress,
    poolAbi,
    unitType,
    provider,
    tokenContractAddress,
    tokenABI,
    tokenContract,
  };
};

const fetchPoolTogetherHistory = async (contractAddress: string, accountAddress: string): Promise<Object> => {
  const poolAddress = contractAddress.toLowerCase();
  const sender = accountAddress.toLowerCase();
  /* eslint-disable i18next/no-literal-string */
  const query = `
    {
      deposits(where: {sender: "${sender}", contractAddress: "${poolAddress}"}) {
        hash
        contractAddress
        sender
        amount
      },
      withdrawals(where: {sender: "${sender}", contractAddress: "${poolAddress}"}) {
        hash
        contractAddress
        sender
        amount
      },
    }
  `;
  /* eslint-enable i18next/no-literal-string */
  return callSubgraph(getEnv().POOLTOGETHER_SUBGRAPH_NAME, query);
};

export async function getPoolTogetherTransactions(symbol: string, address: string): Promise<Object> {
  const { unitType, poolContractAddress: contractAddress } = getPoolTogetherTokenContract(symbol);
  let deposits = [];
  let withdrawals = [];
  const rawHistory = await fetchPoolTogetherHistory(contractAddress, address)
    .catch(() => null);
  if (rawHistory) {
    const { deposits: rawDeposits, withdrawals: rawWithdraws } = rawHistory;
    deposits = rawDeposits.map(tx => {
      return {
        hash: tx.hash,
        amount: tx.amount,
        symbol,
        decimals: unitType,
        tag: POOLTOGETHER_DEPOSIT_TRANSACTION,
      };
    });
    const allWithdrawals = rawWithdraws.map(tx => {
      return {
        hash: tx.hash,
        amount: tx.amount,
        symbol,
        decimals: unitType,
        tag: POOLTOGETHER_WITHDRAW_TRANSACTION,
      };
    });
    withdrawals = allWithdrawals.reduce((txs, tx) => {
      const index = txs.findIndex(({ hash }) => hash === tx.hash);
      if (index > -1) {
        txs[index] = {
          ...txs[index],
          amount: ptUtils.toBN(txs[index].amount).add(ptUtils.toBN(tx.amount)).toString(),
        };
      } else {
        txs[txs.length] = tx;
      }
      return txs;
    }, []);
  }
  return {
    deposits,
    withdrawals,
  };
}
