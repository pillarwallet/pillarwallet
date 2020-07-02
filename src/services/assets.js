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
import { NETWORK_PROVIDER, COLLECTIBLES_NETWORK, BALANCE_CHECK_CONTRACT } from 'react-native-dotenv';
import cryptocompare from 'cryptocompare';
import abiHelper from 'ethjs-abi';

// constants
import { BTC, ETH, HOT, HOLO, supportedFiatCurrencies } from 'constants/assetsConstants';

// utils
import { getEthereumProvider, parseTokenBigNumberAmount, reportLog } from 'utils/common';

// abis
import ERC20_CONTRACT_ABI from 'abi/erc20.json';
import ERC721_CONTRACT_ABI from 'abi/erc721.json';
import ERC721_CONTRACT_ABI_SAFE_TRANSFER_FROM from 'abi/erc721_safeTransferFrom.json';
import ERC721_CONTRACT_ABI_TRANSFER_FROM from 'abi/erc721_transferFrom.json';
import BALANCE_CHECKER_CONTRACT_ABI from 'abi/balanceChecker.json';

import type { Asset } from 'models/Asset';


type Address = string;

type ERC20TransferOptions = {
  contractAddress: ?string,
  to: Address,
  amount: number | string,
  wallet: Object,
  decimals: number,
  nonce?: number,
  signOnly?: ?boolean,
  gasLimit: number,
  gasPrice: number,
  data?: string,
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
  amount: number | string,
  to: Address,
  wallet: Object,
  nonce?: number,
  signOnly?: ?boolean,
  data?: string,
};

type FetchBalancesResponse = Array<{
  balance: string,
  symbol: string,
}>;

function contractHasMethod(contractCode, encodedMethodName) {
  return contractCode.includes(encodedMethodName);
}

export async function transferERC20(options: ERC20TransferOptions) {
  const {
    contractAddress,
    amount,
    wallet: walletInstance,
    decimals: defaultDecimals = 18,
    nonce,
    gasLimit,
    gasPrice,
    signOnly = false,
  } = options;
  let { data, to } = options;

  const wallet = walletInstance.connect(getEthereumProvider(NETWORK_PROVIDER));
  const contract = new Contract(contractAddress, ERC20_CONTRACT_ABI, wallet);
  const contractAmount = parseTokenBigNumberAmount(amount, defaultDecimals);

  if (!data) {
    try {
      data = await contract.interface.functions.transfer.encode([to, contractAmount]);
    } catch (e) {
      //
    }
    to = contractAddress;
  }

  const transaction = {
    gasLimit,
    gasPrice: utils.bigNumberify(gasPrice),
    to,
    nonce,
    data,
  };
  if (!signOnly) return wallet.sendTransaction(transaction);

  const signedHash = await wallet.sign(transaction);
  return { signedHash, value: contractAmount };
}

export function getERC721ContractTransferMethod(code: any, isReceiverContractAddress: boolean): string {
  /**
   * sending to contract with "safeTransferFrom" will fail if contract doesn't have
   * "onERC721Received" event implemented, just to make everything more
   * stable we can just disable safeTransferFrom if receiver
   * address is contract and use other methods
   * this can be improved by checking if contract byte code
   * contains hash of "onERC721Received", but this might not be
   * always true as "contract" might be a proxy and will return that
   * it doesn't have it anyway
   * (ref – https://github.com/ethereum/EIPs/blob/master/EIPS/eip-721.md)
   */

  // first 4 bytes of the encoded signature for a lookup in the contract code
  // encoding: utils.keccak256(utils.toUtf8Bytes(signature)
  const transferHash = 'a9059cbb'; // transfer(address,uint256)
  const transferFromHash = '23b872dd'; // transferFrom(address,address,uint256)
  const safeTransferFromHash = '42842e0e'; // safeTransferFrom(address,address,uint256)

  if (!isReceiverContractAddress && contractHasMethod(code, safeTransferFromHash)) {
    return 'safeTransferFrom';
  } else if (contractHasMethod(code, transferHash)) {
    return 'transfer';
  } else if (contractHasMethod(code, transferFromHash)) {
    return 'transferFrom';
  }
  return '';
}

export const getContractMethodAbi = (
  contractAbi: Object[],
  methodName: string,
): ?Object => contractAbi.find(item => item.name === methodName);

export const buildERC721TransactionData = async (transaction: Object, provider: any): any => {
  const {
    from,
    to,
    tokenId,
    contractAddress,
  } = transaction;

  let methodAbi;
  let data;

  const code = await provider.getCode(contractAddress);
  const receiverCode = await provider.getCode(contractAddress);
  // regular address will return exactly 0x while contract address will return 0x...0
  const isReceiverContractAddress = receiverCode && receiverCode.length > 2;
  const contractTransferMethod = getERC721ContractTransferMethod(code, isReceiverContractAddress);

  try {
    switch (contractTransferMethod) {
      case 'safeTransferFrom':
        methodAbi = getContractMethodAbi(ERC721_CONTRACT_ABI_SAFE_TRANSFER_FROM, contractTransferMethod);
        data = abiHelper.encodeMethod(methodAbi, [from, to, tokenId]);
        break;
      case 'transfer':
        methodAbi = getContractMethodAbi(ERC721_CONTRACT_ABI, contractTransferMethod);
        data = abiHelper.encodeMethod(methodAbi, [to, tokenId]);
        break;
      case 'transferFrom':
        methodAbi = getContractMethodAbi(ERC721_CONTRACT_ABI_TRANSFER_FROM, contractTransferMethod);
        data = abiHelper.encodeMethod(methodAbi, [from, to, tokenId]);
        break;
      default:
    }
  } catch (e) {
    // unable to transfer
  }

  return data;
};

export async function transferERC721(options: ERC721TransferOptions) {
  const {
    contractAddress,
    tokenId,
    wallet: walletInstance,
    nonce,
    gasLimit,
    gasPrice,
    signOnly = false,
  } = options;

  const wallet = walletInstance.connect(getEthereumProvider(COLLECTIBLES_NETWORK));
  const data = await buildERC721TransactionData(options, wallet.provider);

  if (data) {
    const transaction = {
      gasLimit,
      gasPrice: utils.bigNumberify(gasPrice),
      to: contractAddress,
      nonce,
      data,
    };

    if (signOnly) return wallet.sign({ ...transaction, data });

    return wallet.sendTransaction(transaction);
  }

  reportLog('Could not transfer collectible', {
    networkProvider: COLLECTIBLES_NETWORK,
    contractAddress,
    tokenId,
  });
  return { error: 'can not be transferred', noRetry: true };
}

export async function transferETH(options: ETHTransferOptions) {
  const {
    to,
    wallet: walletInstance,
    gasPrice,
    gasLimit,
    amount,
    nonce,
    signOnly = false,
    data,
  } = options;
  const value = utils.parseEther(amount.toString());
  const trx = {
    gasLimit,
    gasPrice: utils.bigNumberify(gasPrice),
    value,
    to,
    nonce,
    data,
  };
  const wallet = walletInstance.connect(getEthereumProvider(NETWORK_PROVIDER));
  if (!signOnly) return wallet.sendTransaction(trx);
  const signedHash = await wallet.sign(trx);
  return { signedHash, value };
}

// Fetch methods are temporary until the BCX API provided

export function fetchETHBalance(walletAddress: Address): Promise<string> {
  const provider = getEthereumProvider(NETWORK_PROVIDER);
  return provider.getBalance(walletAddress).then(utils.formatEther);
}

export function fetchRinkebyETHBalance(walletAddress: Address): Promise<string> {
  const provider = getEthereumProvider('rinkeby');
  return provider.getBalance(walletAddress).then(utils.formatEther);
}

export function fetchERC20Balance(
  walletAddress: Address,
  contractAddress: Address,
  decimals: number = 18,
): Promise<string> {
  const provider = getEthereumProvider(NETWORK_PROVIDER);
  const contract = new Contract(contractAddress, ERC20_CONTRACT_ABI, provider);
  return contract.balanceOf(walletAddress).then((wei) => utils.formatUnits(wei, decimals));
}

export function fetchAssetBalancesOnChain(assets: Asset[], walletAddress: string): Promise<FetchBalancesResponse> {
  const promises = assets
    .map(async (asset: Asset) => {
      const balance = asset.symbol === ETH
        ? await fetchETHBalance(walletAddress).catch(() => null)
        : await fetchERC20Balance(walletAddress, asset.address, asset.decimals).catch(() => null);
      return {
        balance,
        symbol: asset.symbol,
      };
    });
  return Promise.all(promises)
    .then(balances => balances.filter(({ balance }) => balance !== null))
    .catch(() => []);
}

export async function fetchAddressBalancesFromProxyContract(
  assets: Asset[],
  accountAddress: string,
): Promise<FetchBalancesResponse> {
  if (!['homestead', 'ropsten'].includes(NETWORK_PROVIDER)) return [];

  const tokens = assets.map(({ address }) => address);
  const provider = getEthereumProvider(NETWORK_PROVIDER);
  const contract = new Contract(BALANCE_CHECK_CONTRACT, BALANCE_CHECKER_CONTRACT_ABI, provider);

  const balances = await contract.balances([accountAddress], tokens)
    .then(values =>
      assets.map((asset, assetIdx) => ({
        symbol: asset.symbol,
        balance: utils.formatUnits(values[assetIdx], asset.decimals),
      })))
    .catch(() => []);
  return balances;
}

export function getExchangeRates(assets: string[]): Promise<?Object> {
  if (!assets.length) return Promise.resolve({});
  const targetCurrencies = supportedFiatCurrencies.concat(ETH);

  assets = assets.map(token => {
    // rename HOT to HOLO
    if (token.toUpperCase() === HOT) {
      return HOLO;
    }
    return token;
  });
  assets = assets.concat(BTC);

  return cryptocompare.priceMulti(assets, targetCurrencies)
    .then(data => {
      // rename HOLO to HOT
      if (data[HOLO]) {
        data[HOT] = { ...data[HOLO] };
        delete data[HOLO];
      }
      return data;
    }).catch(() => ({}));
}

// from the getTransaction() method you'll get the the basic tx info without the status
export function fetchTransactionInfo(hash: string, network?: string): Promise<?Object> {
  const provider = getEthereumProvider(network || NETWORK_PROVIDER);
  return provider.getTransaction(hash).catch(() => null);
}

// receipt available for mined transactions only, here you can get the status of the tx
export function fetchTransactionReceipt(hash: string, network?: string): Promise<?Object> {
  const provider = getEthereumProvider(network || NETWORK_PROVIDER);
  return provider.getTransactionReceipt(hash).catch(() => null);
}

export function fetchLastBlockNumber(network?: string): Promise<number> {
  const provider = getEthereumProvider(network || NETWORK_PROVIDER);
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

export const DEFAULT_GAS_LIMIT = 500000;

export async function calculateGasEstimate(transaction: Object) {
  const {
    from,
    amount,
    symbol,
    contractAddress,
    decimals: defaultDecimals = 18,
    tokenId,
  } = transaction;
  let { to, data } = transaction;
  const provider = getEthereumProvider(tokenId ? COLLECTIBLES_NETWORK : NETWORK_PROVIDER);
  const value = symbol === ETH
    ? utils.parseEther(amount.toString())
    : '0x';
  try {
    if (tokenId) {
      data = await buildERC721TransactionData(transaction, provider);
      if (!data) return DEFAULT_GAS_LIMIT;
      to = contractAddress;
    } else if (!data && contractAddress && symbol !== ETH) {
      /**
       * we check `symbol !== ETH` because our assets list also includes ETH contract address
       * so want to check if it's also not ETH send flow
       */
      const contract = new Contract(contractAddress, ERC20_CONTRACT_ABI, provider);
      const contractAmount = parseTokenBigNumberAmount(amount, defaultDecimals);
      data = await contract.interface.functions.transfer.encode([to, contractAmount]);
      to = contractAddress;
    }
  } catch (e) {
    return DEFAULT_GAS_LIMIT;
  }
  // all parameters are required in order to estimate gas limit precisely
  return provider.estimateGas({
    from,
    to,
    data,
    value,
  })
    .then(calculatedGasLimit =>
      Math.round(utils.bigNumberify(calculatedGasLimit).toNumber() * 1.5), // safe buffer multiplier
    )
    .catch(() => DEFAULT_GAS_LIMIT);
}

export const getContract = (
  address: string,
  abi: string,
  // for wallet calls set wallet provider, for general purpose use default
  provider: Object = getEthereumProvider(NETWORK_PROVIDER),
) => {
  try {
    return new Contract(address, abi, provider);
  } catch (error) {
    reportLog('Failed to create Contract', { error });
    return null;
  }
};

export const buildERC20ApproveTransactionData = (
  spenderAddress: string,
  amount: number,
  decimals: number,
): string => {
  const methodAbi = getContractMethodAbi(ERC20_CONTRACT_ABI, 'approve');
  const contractAmount = parseTokenBigNumberAmount(amount, decimals);
  return abiHelper.encodeMethod(methodAbi, [spenderAddress, contractAmount]);
};
