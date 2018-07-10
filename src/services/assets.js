// @flow
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
  wallet: Object
}

type ETHTransferOptions = {
  gasLimit: number,
  gasPrice: number,
  amount: number,
  to: Address,
  wallet: Object
}

export function transferERC20(options: ERC20TransferOptions) {
  const {
    contractAddress,
    to,
    amount,
    wallet,
  } = options;
  wallet.provider = providers.getDefaultProvider(PROVIDER);
  const contract = new Contract(contractAddress, CONTRACT_ABI, wallet);
  const numberOfDecimals = 18;
  return contract.transfer(to, utils.parseUnits(amount.toString(), numberOfDecimals));
}

export function transferETH(options: ETHTransferOptions) {
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
  return wallet.sendTransaction(trx);
}

// Fetch methods are temporary until the BCX API provided

export function fetchETHBalance(walletAddress: Address) {
  const provider = providers.getDefaultProvider(PROVIDER);
  return provider.getBalance(walletAddress).then(utils.formatEther);
}

export function fetchERC20Balance(walletAddress: Address, contractAddress: Address) {
  const provider = providers.getDefaultProvider(PROVIDER);
  const contract = new Contract(contractAddress, CONTRACT_ABI, provider);
  return contract.balanceOf(walletAddress).then(utils.formatEther);
}

export function fetchAssetBalances(assets: Asset[], walletAddress: string): Promise<Object[]> {
  const promises = assets
    .map(async (asset: Asset) => {
      const balance = asset.symbol === ETH
        ? await fetchETHBalance(walletAddress)
        : await fetchERC20Balance(walletAddress, asset.address).catch(() => 0);
      return {
        balance,
        symbol: asset.symbol,
      };
    });
  return Promise.all(promises).catch(() => ([]));
}

export function getExchangeRates(assets: string[]): Promise<?Object> {
  return cryptocompare.priceMulti(assets, supportedFiatCurrencies).catch(() => ({}));
}
