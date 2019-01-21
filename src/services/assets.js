// @flow
import { Contract, utils, providers } from 'ethers';
import { NETWORK_PROVIDER } from 'react-native-dotenv';
import cryptocompare from 'cryptocompare';
import { ETH, supportedFiatCurrencies } from 'constants/assetsConstants';
import type { Asset } from 'models/Asset';
import ERC20_CONTRACT_ABI from 'abi/erc20.json';
import ERC721_CONTRACT_ABI from 'abi/erc721.json';

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

export function transferERC721(options: ERC721TransferOptions) {
  const {
    contractAddress,
    from,
    to,
    tokenId,
    wallet,
    nonce,
  } = options;
  wallet.provider = providers.getDefaultProvider(PROVIDER);
  const contract = new Contract(contractAddress, ERC721_CONTRACT_ABI, wallet);
  return contract.safeTransferFrom(from, to, tokenId, { nonce });
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
