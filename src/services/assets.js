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
import { Contract, utils, providers } from 'ethers';
import { NETWORK_PROVIDER } from 'react-native-dotenv';
import cryptocompare from 'cryptocompare';
import { ETH, supportedFiatCurrencies } from 'constants/assetsConstants';
import type { Asset } from 'models/Asset';

const PROVIDER = NETWORK_PROVIDER;

const CONTRACT_ABI = [{
  constant: true,
  inputs: [
    {
      name: '_owner',
      type: 'address',
    },
  ],
  name: 'balanceOf',
  outputs: [
    {
      name: 'balance',
      type: 'uint256',
    },
  ],
  payable: false,
  type: 'function',
},
{
  name: 'transfer',
  type: 'function',
  inputs: [
    {
      name: '_to',
      type: 'address',
    },
    {
      type: 'uint256',
      name: '_tokens',
    },
  ],
  constant: false,
  outputs: [],
  payable: false,
}];

type Address = string;

type ERC20TransferOptions = {
  contractAddress: ?string,
  to: Address,
  amount: number,
  wallet: Object,
  decimals: number,
  nonce?: number,
}

type ETHTransferOptions = {
  gasLimit: number,
  gasPrice: number,
  amount: number,
  to: Address,
  wallet: Object,
  nonce?: number,
}

export function transferERC20(options: ERC20TransferOptions) {
  const {
    contractAddress,
    to,
    amount,
    wallet,
    decimals = 18,
    nonce,
  } = options;
  wallet.provider = providers.getDefaultProvider(PROVIDER);
  const contract = new Contract(contractAddress, CONTRACT_ABI, wallet);
  if (decimals > 0) {
    return contract.transfer(to, utils.parseUnits(amount.toString(), decimals), { nonce });
  }
  return contract.transfer(to, utils.bigNumberify(amount.toString()), { nonce });
}

export function transferETH(options: ETHTransferOptions) {
  const {
    to,
    wallet,
    gasPrice,
    gasLimit,
    amount,
    nonce,
  } = options;
  const trx = {
    gasLimit,
    gasPrice: utils.bigNumberify(gasPrice),
    value: utils.parseEther(amount.toString()),
    to,
    nonce,
  };
  wallet.provider = providers.getDefaultProvider(PROVIDER);
  return wallet.sendTransaction(trx);
}

// Fetch methods are temporary until the BCX API provided

export function fetchETHBalance(walletAddress: Address) {
  const provider = providers.getDefaultProvider(PROVIDER);
  return provider.getBalance(walletAddress).then(utils.formatEther);
}

export function fetchERC20Balance(walletAddress: Address, contractAddress: Address, decimals: number = 18) {
  const provider = providers.getDefaultProvider(PROVIDER);
  const contract = new Contract(contractAddress, CONTRACT_ABI, provider);
  return contract.balanceOf(walletAddress).then((wei) => utils.formatUnits(wei, decimals));
}

export function fetchAssetBalances(assets: Asset[], walletAddress: string): Promise<Object[]> {
  const promises = assets
    .map(async (asset: Asset) => {
      const balance = asset.symbol === ETH
        ? await fetchETHBalance(walletAddress)
        : await fetchERC20Balance(walletAddress, asset.address, asset.decimals).catch(() => 0);
      return {
        balance,
        symbol: asset.symbol,
      };
    });
  return Promise.all(promises).catch(() => ([]));
}

export function getExchangeRates(assets: string[]): Promise<?Object> {
  if (!assets.length) return Promise.resolve({});
  return cryptocompare.priceMulti(assets, supportedFiatCurrencies).catch(() => ({}));
}

// from the getTransaction() method you'll get the the basic tx info without the status
export function fetchTransactionInfo(hash: string): Promise<?Object> {
  const provider = providers.getDefaultProvider(PROVIDER);
  return provider.getTransaction(hash).catch(() => null);
}

// receipt available for mined transactions only, here you can get the status of the tx
export function fetchTransactionReceipt(hash: string): Promise<?Object> {
  const provider = providers.getDefaultProvider(PROVIDER);
  return provider.getTransactionReceipt(hash).catch(() => null);
}

export function fetchLastBlockNumber(): Promise<number> {
  const provider = providers.getDefaultProvider(PROVIDER);
  return provider.getBlockNumber().then(parseInt).catch(() => 0);
}
