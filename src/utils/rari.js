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
import { BigNumber as EthersBigNumber, utils, constants as ethersConstants } from 'ethers';
import { encodeContractMethod, getContract, buildERC20ApproveTransactionData } from 'services/assets';
import { get0xSwapOrders } from 'services/0x.js';
import { getEnv } from 'configs/envConfig';
import { DAI, USDC, USDT, TUSD, mUSD, ETH, WETH, USD } from 'constants/assetsConstants';
import { reportErrorLog, parseTokenBigNumberAmount } from 'utils/common';
import RARI_FUND_MANAGER_CONTRACT_ABI from 'abi/rariFundManager.json';
import RARI_FUND_PROXY_CONTRACT_ABI from 'abi/rariFundProxy.json';
import ERC20_CONTRACT_ABI from 'abi/erc20.json';
import MSTABLE_CONTRACT_ABI from 'abi/mAsset.json';
import type { Asset, Rates } from 'models/Asset';


const getRariAcceptedCurrencies = () => {
  const rariContract = getContract(
    getEnv().RARI_FUND_MANAGER_CONTRACT_ADDRESS,
    RARI_FUND_MANAGER_CONTRACT_ABI,
  );
  if (!rariContract) return null;
  return rariContract.callStatic.getAcceptedCurrencies()
    .catch((error => {
      reportErrorLog("Rari service failed: Can't get accepted currencies", { error });
      return null;
    }));
};

const getMStableSwapOutput = (
  inputTokenAddress: string, outputTokenAddress: string, amountBN: EthersBigNumber,
) => {
  const mstableContract = getContract(
    getEnv().MSTABLE_CONTRACT_ADDRESS,
    MSTABLE_CONTRACT_ABI,
  );
  if (!mstableContract) return null;
  return mstableContract.getSwapOutput(
    inputTokenAddress,
    outputTokenAddress,
    amountBN,
  ).catch((error) => {
    reportErrorLog("Rari service failed: Can't get mStable swap output", { error });
    return null;
  });
};

const getRariDepositTransactionData = async (
  amountBN: EthersBigNumber, token: Asset, supportedAssets: Asset[], rates: Rates,
) => {
  const acceptedCurrencies = await getRariAcceptedCurrencies();
  if (!acceptedCurrencies) return null;

  let txValue = EthersBigNumber.from(0);
  if (token.symbol === ETH) {
    txValue = txValue.add(amountBN);
  }

  // token can be directly deposited, no exchange fee
  if (acceptedCurrencies.includes(token.symbol)) {
    return {
      depositTransactionData: encodeContractMethod(RARI_FUND_MANAGER_CONTRACT_ABI, 'deposit', [
        token.symbol,
        amountBN,
      ]),
      txValue,
      exchangeFeeBN: EthersBigNumber.from(0),
      slippage: 0,
      rariContractAddress: getEnv().RARI_FUND_MANAGER_CONTRACT_ADDRESS,
    };
  }

  let acceptedCurrency = acceptedCurrencies[0];
  let acceptedAsset = supportedAssets.find(asset => asset.symbol === acceptedCurrency);

  if (!acceptedAsset) {
    reportErrorLog("Rari service failed: can't find asset", { asset: acceptedCurrency });
    return null;
  }

  // try mStable
  // TODO: if user wants to deposit mUSD the flow is a bit different
  // you need to use MassetValidationHelper.getRedeemValidity to get swap output data
  // but since mUSD is not yet supported we don't need to implement it right now
  if ([DAI, USDC, USDT, TUSD].includes(token.symbol)) {
    for (let i = 0; i < acceptedCurrencies.length; ++i) {
      acceptedCurrency = acceptedCurrencies[i];
      acceptedAsset = supportedAssets.find(asset => asset.symbol === acceptedCurrencies[i]);

      if (![DAI, USDC, USDT, TUSD, mUSD].includes(acceptedCurrency) || !acceptedAsset) {
        continue;  // eslint-disable-line
      }

      // eslint-disable-next-line
      const mStableSwapOutput = await getMStableSwapOutput(token.address, acceptedAsset.address, amountBN);
      if (mStableSwapOutput && mStableSwapOutput['0']) {
        const ethRates = rates[ETH];
        if (!ethRates) {
          reportErrorLog('Rari service failed: no ETH exchange rate');
        }
        const formattedInput = utils.formatUnits(amountBN, token.decimals);
        const formattedOutput = utils.formatUnits(mStableSwapOutput.output, acceptedAsset.decimals);
        const mStableFeeUSD = formattedInput - formattedOutput; // we assume that stablecoins price is 1$

        return {
          depositTransactionData: encodeContractMethod(
            RARI_FUND_PROXY_CONTRACT_ABI,
            'exchangeAndDeposit(string,uint256,string)',
            [
              token.symbol,
              amountBN,
              acceptedCurrency,
            ]),
          txValue,
          exchangeFeeBN: utils.parseEther((mStableFeeUSD / ethRates[USD]).toFixed(18)),
          slippage: 0, // mStable has no slippage
          rariContractAddress: getEnv().RARI_FUND_PROXY_CONTRACT_ADDRESS,
        };
      }
    }
  }

  // try 0x
  const _0xdata = await get0xSwapOrders(
    token.symbol === ETH
      ? WETH
      : token.address,
    acceptedAsset.address,
    amountBN,
  );
  if (!_0xdata) {
    return null;
  }
  const signatures = [];
  const [
    orders,
    inputFilledAmountBN,
    protocolFee,
    takerAssetFilledAmountBN,
    price,
    guaranteedPrice,
  ] = _0xdata;

  if (inputFilledAmountBN.lt(amountBN)) {
    reportErrorLog(
      `Rari service failed: Unable to find enough liquidity to exchange ${token.symbol} before depositing.`,
    );
    return null;
  }

  for (let j = 0; j < orders.length; j++) {
    const { signature, ...order } = orders[j];
    signatures[j] = signature;
    orders[j] = order;
  }

  const slippage = (Math.abs(price - guaranteedPrice) / price) * 100;

  return {
    depositTransactionData: encodeContractMethod(
      RARI_FUND_PROXY_CONTRACT_ABI,
      'exchangeAndDeposit(address,uint256,string,(address,address,address,address,uint256,uint256,' +
        'uint256,uint256,uint256,uint256,bytes,bytes,bytes,bytes)[],bytes[],uint256)',
      [
        token.symbol === ETH
          ? ethersConstants.AddressZero
          : token.address,
        amountBN,
        acceptedCurrency,
        orders,
        signatures,
        takerAssetFilledAmountBN,
      ]),
    txValue: txValue.add(protocolFee),
    exchangeFeeBN: EthersBigNumber.from(protocolFee),
    slippage,
    rariContractAddress: getEnv().RARI_FUND_PROXY_CONTRACT_ADDRESS,
  };
};

export const getRariDepositTransactionsAndExchangeFee = async (
  senderAddress: string, amount: number, token: Asset, supportedAssets: Asset[], rates: Rates,
) => {
  const amountBN = parseTokenBigNumberAmount(amount, token.decimals);
  const data = await getRariDepositTransactionData(amountBN, token, supportedAssets, rates);
  if (!data) return null;

  const {
    depositTransactionData, txValue, exchangeFeeBN, slippage, rariContractAddress,
  } = data;

  let depositTransactions = [{
    from: senderAddress,
    to: rariContractAddress,
    data: depositTransactionData,
    amount: parseFloat(utils.formatEther(txValue)),
    symbol: ETH,
  }];

  if (token.symbol !== ETH) {
    const erc20Contract = getContract(token.address, ERC20_CONTRACT_ABI);
    const approvedAmountBN = erc20Contract
      ? await erc20Contract.allowance(senderAddress, rariContractAddress)
      : null;

    if (!approvedAmountBN || amountBN.gt(approvedAmountBN)) {
      const approveTransactionData = buildERC20ApproveTransactionData(rariContractAddress, amount, token.decimals);
      depositTransactions = [
        {
          from: senderAddress,
          to: token.address,
          data: approveTransactionData,
          amount: 0,
          symbol: ETH,
        },
        ...depositTransactions,
      ];
    }
  }
  return { depositTransactions, exchangeFeeBN, slippage };
};
