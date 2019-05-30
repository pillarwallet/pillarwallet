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
import { NETWORK_PROVIDER, COLLECTIBLES_NETWORK } from 'react-native-dotenv';
import cryptocompare from 'cryptocompare';
import { Sentry } from 'react-native-sentry';
import { ETH, supportedFiatCurrencies } from 'constants/assetsConstants';
import type { Asset } from 'models/Asset';
import ERC20_CONTRACT_ABI from 'abi/erc20.json';
import ERC721_CONTRACT_ABI from 'abi/erc721.json';
import ERC721_CONTRACT_ABI_SAFE_TRANSFER_FROM from 'abi/erc721_safeTransferFrom.json';
import ERC721_CONTRACT_ABI_TRANSFER_FROM from 'abi/erc721_transferFrom.json';
import { getEthereumProvider } from 'utils/common';

type Address = string;

type ERC20TransferOptions = {
  contractAddress: ?string,
  to: Address,
  amount: number,
  wallet: Object,
  decimals: number,
  nonce?: number,
  signOnly?: ?boolean,
  gasLimit?: ?number,
  gasPrice?: ?number,
};

type ERC721TransferOptions = {
  contractAddress: ?string,
  from: Address,
  to: Address,
  tokenId: string,
  wallet: Object,
  nonce?: number,
  signOnly?: ?boolean,
  gasLimit?: ?number,
  gasPrice?: ?number,
};

type ETHTransferOptions = {
  gasLimit: number,
  gasPrice: number,
  amount: number,
  to: Address,
  wallet: Object,
  nonce?: number,
  signOnly?: ?boolean,
};

function contractHasMethod(contractCode, encodedMethodName) {
  return contractCode.includes(encodedMethodName);
}

export async function transferERC20(options: ERC20TransferOptions) {
  const {
    contractAddress,
    to,
    amount,
    wallet,
    decimals: defaultDecimals = 18,
    nonce,
    gasLimit,
    gasPrice,
    signOnly = false,
  } = options;
  wallet.provider = getEthereumProvider(NETWORK_PROVIDER);
  const contract = new Contract(contractAddress, ERC20_CONTRACT_ABI, wallet);
  const decimals = defaultDecimals > 0
    ? utils.parseUnits(amount.toString(), defaultDecimals)
    : utils.bigNumberify(amount.toString());

  if (!signOnly) return contract.transfer(to, decimals, { nonce });

  const tokenTransfer = await contract.interface.functions.transfer.apply(null, [to, decimals]);
  const { data } = tokenTransfer;
  const transaction = {
    gasLimit,
    gasPrice: utils.bigNumberify(gasPrice),
    to: contractAddress,
    nonce,
    data,
  };
  const signedHash = await wallet.sign(transaction);
  return { signedHash, value: decimals };
}

export function getERC721ContractTransferMethod(code: any): string {
  // first 4 bytes of the encoded signature for a lookup in the contract code
  // encoding: utils.keccak256(utils.toUtf8Bytes(signature)
  const transferHash = 'a9059cbb'; // transfer(address,uint256)
  const transferFromHash = '23b872dd'; // transferFrom(address,address,uint256)
  const safeTransferFromHash = '42842e0e'; // safeTransferFrom(address,address,uint256)

  if (contractHasMethod(code, safeTransferFromHash)) {
    return 'safeTransferFrom';
  } else if (contractHasMethod(code, transferHash)) {
    return 'transfer';
  } else if (contractHasMethod(code, transferFromHash)) {
    return 'transferFrom';
  }
  return '';
}

export async function transferERC721(options: ERC721TransferOptions) {
  const {
    contractAddress,
    from,
    to,
    tokenId,
    wallet,
    nonce,
    gasLimit,
    gasPrice,
    signOnly = false,
  } = options;
  wallet.provider = getEthereumProvider(COLLECTIBLES_NETWORK);

  let contract;
  const code = await wallet.provider.getCode(contractAddress);
  const contractTransferMethod = getERC721ContractTransferMethod(code);

  // used if signOnly
  let contractSignedTransaction;
  let contractMethodApplied;
  if (signOnly) {
    contractSignedTransaction = {
      gasLimit,
      gasPrice: utils.bigNumberify(gasPrice),
      to: contractAddress,
      nonce,
    };
  }

  switch (contractTransferMethod) {
    case 'safeTransferFrom':
      contract = new Contract(contractAddress, ERC721_CONTRACT_ABI_SAFE_TRANSFER_FROM, wallet);
      if (!signOnly) return contract.safeTransferFrom(from, to, tokenId, { nonce });
      contractMethodApplied = await contract.interface.functions.safeTransferFrom.apply(null, [from, to, tokenId]);
      return wallet.sign({
        ...contractSignedTransaction,
        data: contractMethodApplied.data,
      });
    case 'transfer':
      contract = new Contract(contractAddress, ERC721_CONTRACT_ABI, wallet);
      if (!signOnly) return contract.transfer(to, tokenId, { nonce });
      contractMethodApplied = await contract.interface.functions.transfer.apply(null, [to, tokenId]);
      return wallet.sign({
        ...contractSignedTransaction,
        data: contractMethodApplied.data,
      });
    case 'transferFrom':
      contract = new Contract(contractAddress, ERC721_CONTRACT_ABI_TRANSFER_FROM, wallet);
      if (!signOnly) return contract.transferFrom(from, to, tokenId, { nonce });
      contractMethodApplied = await contract.interface.functions.transferFrom.apply(null, [from, to, tokenId]);
      return wallet.sign({
        ...contractSignedTransaction,
        data: contractMethodApplied.data,
      });
    default:
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

export async function transferETH(options: ETHTransferOptions) {
  const {
    to,
    wallet,
    gasPrice,
    gasLimit,
    amount,
    nonce,
    signOnly = false,
  } = options;
  const value = utils.parseEther(amount.toString());
  const trx = {
    gasLimit,
    gasPrice: utils.bigNumberify(gasPrice),
    value,
    to,
    nonce,
  };
  wallet.provider = getEthereumProvider(NETWORK_PROVIDER);
  if (!signOnly) return wallet.sendTransaction(trx);
  const signedHash = await wallet.sign(trx);
  return { signedHash, value };
}

// Fetch methods are temporary until the BCX API provided

export function fetchETHBalance(walletAddress: Address) {
  const provider = getEthereumProvider(NETWORK_PROVIDER);
  return provider.getBalance(walletAddress).then(utils.formatEther);
}

export function fetchRinkebyETHBalance(walletAddress: Address) {
  const provider = getEthereumProvider('rinkeby');
  return provider.getBalance(walletAddress).then(utils.formatEther);
}

export function fetchERC20Balance(walletAddress: Address, contractAddress: Address, decimals: number = 18) {
  const provider = getEthereumProvider(NETWORK_PROVIDER);
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
  const provider = getEthereumProvider(NETWORK_PROVIDER);
  return provider.getTransaction(hash).catch(() => null);
}

// receipt available for mined transactions only, here you can get the status of the tx
export function fetchTransactionReceipt(hash: string): Promise<?Object> {
  const provider = getEthereumProvider(NETWORK_PROVIDER);
  return provider.getTransactionReceipt(hash).catch(() => null);
}

export function fetchLastBlockNumber(): Promise<number> {
  const provider = getEthereumProvider(NETWORK_PROVIDER);
  return provider.getBlockNumber().then(parseInt).catch(() => 0);
}

export function transferSigned(signed: string) {
  const provider = getEthereumProvider(NETWORK_PROVIDER);
  return provider.sendTransaction(signed);
}

export function waitForTransaction(hash: string) {
  const provider = getEthereumProvider(NETWORK_PROVIDER);
  return provider.waitForTransaction(hash);
}
