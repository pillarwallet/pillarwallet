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
import { NETWORK_PROVIDER, COLLECTIBLES_NETWORK } from 'react-native-dotenv';
import cryptocompare from 'cryptocompare';
import { ETH, supportedFiatCurrencies } from 'constants/assetsConstants';
import type { Asset } from 'models/Asset';
import ERC20_CONTRACT_ABI from 'abi/erc20.json';
import ERC721_CONTRACT_ABI from 'abi/erc721.json';
import ERC721_CONTRACT_ABI_SAFE_TRANSFER_FROM from 'abi/erc721_safeTransferFrom.json';
import ERC721_CONTRACT_ABI_TRANSFER_FROM from 'abi/erc721_transferFrom.json';
import { Sentry } from 'react-native-sentry';

const PROVIDER = NETWORK_PROVIDER;

type Address = string;

type ERC20TransferOptions = {
  contractAddress: ?string,
  to: Address,
  amount: number,
  wallet: Object,
  decimals: number,
  nonce?: number,
};

type ERC721TransferOptions = {
  contractAddress: ?string,
  from: Address,
  to: Address,
  tokenId: string,
  wallet: Object,
  nonce?: number,
};

type ETHTransferOptions = {
  gasLimit: number,
  gasPrice: number,
  amount: number,
  to: Address,
  wallet: Object,
  nonce?: number,
};

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
  const contract = new Contract(contractAddress, ERC20_CONTRACT_ABI, wallet);
  if (decimals > 0) {
    return contract.transfer(to, utils.parseUnits(amount.toString(), decimals), { nonce });
  }
  return contract.transfer(to, utils.bigNumberify(amount.toString()), { nonce });
}

export async function transferERC721(options: ERC721TransferOptions) {
  const {
    contractAddress,
    from,
    to,
    tokenId,
    wallet,
    nonce,
  } = options;
  wallet.provider = providers.getDefaultProvider(COLLECTIBLES_NETWORK);

  const code = await wallet.provider.getCode(contractAddress).then((result) => result);

  // signature keccak256
  const transferHash = 'a9059cbb';
  const transferFromHash = '23b872dd';
  const safeTransferFromHash = '42842e0e';

  let contract;
  if (code.indexOf(safeTransferFromHash) > 0) {
    contract = new Contract(contractAddress, ERC721_CONTRACT_ABI_SAFE_TRANSFER_FROM, wallet);
    return contract.safeTransferFrom(from, to, tokenId, { nonce });
  } else if (code.indexOf(transferHash) > 0) {
    contract = new Contract(contractAddress, ERC721_CONTRACT_ABI, wallet);
    return contract.transfer(to, tokenId, { nonce });
  } else if (code.indexOf(transferFromHash) > 0) {
    contract = new Contract(contractAddress, ERC721_CONTRACT_ABI_TRANSFER_FROM, wallet);
    return contract.transferFrom(from, to, tokenId, { nonce });
  }
  Sentry.captureMessage('Could not transfer collectible',
    {
      level: 'info',
      extra: {
        networkProvider: COLLECTIBLES_NETWORK,
        contractAddress,
        tokenId,
      },
    });
  return { error: 'can not be transferred', noRetry: true };
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

export function fetchRinkebyETHBalance(walletAddress: Address) {
  const provider = providers.getDefaultProvider('rinkeby');
  return provider.getBalance(walletAddress).then(utils.formatEther);
}

export function fetchERC20Balance(walletAddress: Address, contractAddress: Address, decimals: number = 18) {
  const provider = providers.getDefaultProvider(PROVIDER);
  const contract = new Contract(contractAddress, ERC20_CONTRACT_ABI, provider);
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
