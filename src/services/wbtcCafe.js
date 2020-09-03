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

// import { utils } from 'ethers';
import { Contract } from 'ethers';

import { isProdEnv } from 'utils/environment';
import { WBTC, BTC } from 'constants/assetsConstants';

import { CURVE_ABI } from 'abi/WBTCCurve.json';
import { getEthereumProvider, reportLog } from 'utils/common';

import type { WBTCFeesWithRate, WBTCFeesRaw } from 'models/WBTC';

// TODO check me
// const renJS = new RenJS(isProdEnv ? 'mainnet' : 'testnet');
// const provider = getEthereumProvider(isProdEnv ? 'homestead' : 'kovan');

// const renContractAddress = isProdEnv ? // TODO fix me
//   '0x9fe350DfA5F66bC086243F21A8F0932514316627' :
//   '0x9fe350DfA5F66bC086243F21A8F0932514316627';


// export const getBTCDepositMint = (contractAddress: string, amount: string | number) => renJS.lockAndMint({
//   // Send BTC from the Bitcoin blockchain to the Ethereum blockchain.
//   sendToken: RenJS.Tokens.BTC.Btc2Eth,

//   // The contract we want to interact with
//   sendTo: renContractAddress,

//   // The name of the function we want to call
//   contractFn: 'deposit', // todo should be mintThenSwap ?

//   nonce: renJS.utils.randomNonce(),

//   // Arguments expected for calling `deposit`
//   contractParams: [ // todo change if we wanna call mintThenSwap
//     {
//       name: '_msg',
//       type: 'bytes',
//       value: web3.utils.fromAscii(`Depositing ${amount} BTC`),
//     },
//   ],

//   // Web3 provider for submitting mint to Ethereum
//   web3Provider: web3.currentProvider,
// });

// export const getMintGatewayAddress = (mint: any): Promise<string> => mint
//   .gatewayAddress()
//   .then(address => address)
//   .catch(() => {}); // todo

// export const waitForMintConfirmationAndGetDeposit = (mint: any) => mint
//   .wait(0)
//   .then(deposit => deposit)
//   .catch(() => {}); // todo

// export const submitDepositAndGetSignature = (deposit: any) => deposit
//   .submit()
//   .then(signature => signature)
//   .catch(() => {}); // todo

// export const submitSignature = async (signature: any) => {
//   try {
//     await signature.submitToEthereum(provider);
//   } catch (e) {
//     // todo
//   }
// };

const CURVE_MAIN = '0x93054188d876f558f4a66B2EF1d97d16eDf0895B';
const CURVE_TEST = '0x62869F49ea8b6c3EEdEcA8b8b1c6731090aD7A3D';

export const gatherFeeData = async (
  amount: number,
  fees: WBTCFeesRaw,
  fromAssetCode: string,
): Promise<?WBTCFeesWithRate> => {
  const isSellingWbtc = fromAssetCode === WBTC;
  const fixedFeeKey = isSellingWbtc ? 'release' : 'lock';
  const dynamicFeeKey = isSellingWbtc ? 'burn' : 'mint';

  const fixedFee = Number(fees[BTC.toLowerCase()][fixedFeeKey] / 100000000); // / 10 ** 8
  const dynamicFeeRate = Number(
    fees[BTC.toLowerCase()].ethereum[dynamicFeeKey] / 10000,
  );

  if (!amount || !fees) return null;

  try {
    let exchangeRate;
    let renVMFee;
    let total;
    const amountInSats = Math.round(amount * 100000000);
    const curve = new Contract(
      isProdEnv ? CURVE_MAIN : CURVE_TEST,
      CURVE_ABI,
      getEthereumProvider(isProdEnv ? 'homestead' : 'kovan'),
    );

    if (isSellingWbtc) {
      const res = await curve.methods.get_dy(0, 1, amountInSats).call();
      const swapResult = res / 100000000; // res / 10 ** 8
      exchangeRate = Number(swapResult / amount);
      renVMFee = Number(swapResult) * dynamicFeeRate;
      total =
        Number(swapResult - renVMFee - fixedFee) > 0
          ? Number(swapResult - renVMFee - fixedFee)
          : 0.000000;
    } else {
      renVMFee = Number(amount) * dynamicFeeRate;
      const amountAfterMint =
        Number(amount - renVMFee - fixedFee) > 0
          ? Number(amount - renVMFee - fixedFee)
          : 0;
      const amountAfterMintInSats = Math.round(amountAfterMint * 100000000);

      if (amountAfterMintInSats) {
        const res = await curve.methods.get_dy(0, 1, amountAfterMintInSats).call();
        const swapResult = res / 100000000; // res / 10 ** 8
        exchangeRate = Number(swapResult / amountAfterMint);
        total = Number(swapResult);
      } else {
        exchangeRate = Number(0);
        total = Number(0);
      }
    }
    return {
      exchangeRate, renVMFee, networkFee: fixedFee, estimate: total,
    };
  } catch (e) {
    reportLog('Failed to estimate WBTC fees and exchange rate', e);
    return null;
  }
};
