// @flow
import { Contract, utils, providers } from 'ethers';
import { NETWORK_PROVIDER } from 'react-native-dotenv';
import cryptocompare from 'cryptocompare';

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
  wallet: Object
}

type ETHTransferOptions = {
  gasLimit: number,
  gasPrice: number,
  amount: number,
  to: Address,
  wallet: Object
}

export async function transferERC20(options: ERC20TransferOptions) {
  const {
    contractAddress,
    to,
    amount,
    wallet,
  } = options;
  wallet.provider = providers.getDefaultProvider(PROVIDER);
  const contract = new Contract(contractAddress, CONTRACT_ABI, wallet);
  const numberOfDecimals = 18;
  const transaction = await contract.transfer(to, utils.parseUnits(amount.toString(), numberOfDecimals));
  return transaction;
}

export async function transferETH(options: ETHTransferOptions) {
  const {
    to,
    wallet,
    gasPrice,
    gasLimit,
    amount,
  } = options;
  const trx = {
    gasLimit,
    gasPrice: utils.bigNumberify(gasPrice),
    value: utils.parseEther(amount.toString()),
    to,
  };
  wallet.provider = providers.getDefaultProvider(PROVIDER);
  const transaction = await wallet.sendTransaction(trx);
  return transaction;
}

// Fetch methods are temporary until the BCX API provided

export async function fetchETHBalance(walletAddress: Address) {
  const provider = providers.getDefaultProvider(PROVIDER);
  const balance = await provider.getBalance(walletAddress).then(utils.formatEther);
  return balance;
}

export async function fetchERC20Balance(walletAddress: Address, contractAddress: Address) {
  const provider = providers.getDefaultProvider(PROVIDER);
  const contract = new Contract(contractAddress, CONTRACT_ABI, provider);
  const balance = await contract.balanceOf(walletAddress).then(utils.formatEther);
  return balance;
}

// TODO: remove and mock
/* const cryptocompare = {
  priceMulti: (tokensArray, priceMulti) => { // eslint-disable-line
    return Promise.resolve({
      ETH: {
        EUR: 624.21,
        GBP: 544.57,
        USD: 748.92,
      },
      PLR: {
        EUR: 0.3142,
        GBP: 0.2762,
        USD: 0.377,
      },
    });
  },
}; */

export function getExchangeRates(assets: string[]): Promise<?Object> {
  return cryptocompare.priceMulti(assets, ['USD', 'EUR', 'GBP']);
}
