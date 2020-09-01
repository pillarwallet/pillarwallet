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

import RenJS from '@renproject/ren';
import web3 from 'web3';
// import { utils } from 'ethers';
import { isProdEnv } from 'utils/environment';
import { getEthereumProvider } from 'utils/common';

// TODO check me
const renJS = new RenJS(isProdEnv ? 'mainnet' : 'testnet');
const provider = getEthereumProvider(isProdEnv ? 'homestead' : 'kovan');

const renContractAddress = isProdEnv ? // TODO fix me
  '0x9fe350DfA5F66bC086243F21A8F0932514316627' :
  '0x9fe350DfA5F66bC086243F21A8F0932514316627';


export const getBTCDepositMint = (contractAddress: string, amount: string | number) => renJS.lockAndMint({
  // Send BTC from the Bitcoin blockchain to the Ethereum blockchain.
  sendToken: RenJS.Tokens.BTC.Btc2Eth,

  // The contract we want to interact with
  sendTo: renContractAddress,

  // The name of the function we want to call
  contractFn: 'deposit', // todo should be mintThenSwap ?

  nonce: renJS.utils.randomNonce(),

  // Arguments expected for calling `deposit`
  contractParams: [ // todo change if we wanna call mintThenSwap
    {
      name: '_msg',
      type: 'bytes',
      value: web3.utils.fromAscii(`Depositing ${amount} BTC`),
    },
  ],

  // Web3 provider for submitting mint to Ethereum
  web3Provider: web3.currentProvider,
});

export const getMintGatewayAddress = (mint: any): Promise<string> => mint
  .gatewayAddress()
  .then(address => address)
  .catch(() => {}); // todo

export const waitForMintConfirmationAndGetDeposit = (mint: any) => mint
  .wait(0)
  .then(deposit => deposit)
  .catch(() => {}); // todo

export const submitDepositAndGetSignature = (deposit: any) => deposit
  .submit()
  .then(signature => signature)
  .catch(() => {}); // todo

export const submitSignature = async (signature: any) => {
  try {
    await signature.submitToEthereum(provider);
  } catch (e) {
    // todo
  }
};
