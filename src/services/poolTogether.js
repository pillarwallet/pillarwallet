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
import { Contract, utils } from 'ethers';
import {
  NETWORK_PROVIDER,
  POOL_DAI_CONTRACT_ADDRESS,
  POOL_USDC_CONTRACT_ADDRESS,
} from 'react-native-dotenv';
import { utils as ptUtils } from 'pooltogetherjs';
import { DAI } from 'constants/assetsConstants';
import { getEthereumProvider, formatMoney } from 'utils/common';

import POOL_DAI_ABI from 'abi/poolDAI.json';
import POOL_USDC_ABI from 'abi/poolUSDC.json';

const POOL_TOGETHER_NETWORK = NETWORK_PROVIDER === 'ropsten' ? 'kovan' : NETWORK_PROVIDER;

export async function getPoolTogetherInfo(symbol: string): Promise<Object> {
  const contractAddress = symbol === DAI ? POOL_DAI_CONTRACT_ADDRESS : POOL_USDC_CONTRACT_ADDRESS;
  const abi = symbol === DAI ? POOL_DAI_ABI : POOL_USDC_ABI;
  const provider = getEthereumProvider(POOL_TOGETHER_NETWORK);
  const contract = new Contract(contractAddress, abi, provider);
  const accountedBalance = await contract.accountedBalance();
  const balanceCallData = contract.interface.functions.balance.encode([]);
  const result = await provider.call({ to: contract.address, data: balanceCallData });
  const balance = contract.interface.functions.balance.decode(result);
  const balanceTakenAt = new Date();
  const currentOpenDrawId = await contract.currentOpenDrawId();
  const currentDraw = await contract.getDraw(currentOpenDrawId);

  const supplyRatePerBlock = await contract.supplyRatePerBlock();

  let currentPrize = ptUtils.toBN(0);
  let prizeEstimate = ptUtils.toBN(0);
  let drawDate;
  let remainingTimeMs;
  if (balance && accountedBalance && currentDraw && supplyRatePerBlock) {
    const { feeFraction, openedBlock } = currentDraw;

    const oneWeekMs = 604800000; // one week in ms
    const { timestamp: blockTimestamp } = await provider.getBlock(openedBlock.toNumber());
    drawDate = (blockTimestamp.toString() * 1000) + oneWeekMs; // adds 14 days to a timestamp in miliseconds

    remainingTimeMs = drawDate - balanceTakenAt.getTime();
    remainingTimeMs = remainingTimeMs < 0 ? 0 : remainingTimeMs;
    const remainingTimeS = remainingTimeMs > 0 ? remainingTimeMs / 1000 : oneWeekMs / 1000;
    const remainingBlocks = remainingTimeS / 15.0; // about 15 second block periods
    const blockFixedPoint18 = utils.parseEther(remainingBlocks.toString());

    const prizeSupplyRate = ptUtils.calculatePrizeSupplyRate(
      supplyRatePerBlock,
      feeFraction,
    );

    currentPrize = ptUtils.calculatePrize(
      balance,
      accountedBalance,
      feeFraction,
    );
    prizeEstimate = ptUtils.calculatePrizeEstimate(
      balance,
      currentPrize,
      blockFixedPoint18,
      prizeSupplyRate,
    );
  }

  return Promise.resolve({
    currentPrize: formatMoney(utils.formatUnits(currentPrize.toString(), 18)),
    prizeEstimate: formatMoney(utils.formatUnits(prizeEstimate.toString(), 18)),
    drawDate,
    remainingTimeMs,
  });
}
