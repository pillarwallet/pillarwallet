import { Contract, utils, providers } from 'ethers';
import { NETWORK_PROVIDER } from 'react-native-dotenv';

const CONTRACT_ABI = [{
  "constant": true,
  "inputs": [
    {
      "name": "_owner",
      "type": "address"
    }
  ],
  "name": "balanceOf",
  "outputs": [
    {
      "name": "balance",
      "type": "uint256"
    }
  ],
  "payable": false,
  "type": "function"
},
{
  "name": "transfer",
  "type": "function",
  "inputs": [
    {
      "name": "_to",
      "type": "address"
    },
    {
      "type": "uint256",
      "name": "_tokens"
    }
  ],
  "constant": false,
  "outputs": [],
  "payable": false
}];

type Address = string;

type ERC20TransferOptions = {
  contractAddress: string,
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
  const { contractAddress, to, amount, wallet } = options;
  wallet.provider = providers.getDefaultProvider(NETWORK_PROVIDER);
  const contract = new Contract(contractAddress, CONTRACT_ABI, wallet);
  const numberOfDecimals = 18;
  return await contract.transfer(to, utils.parseUnits(amount.toString(), numberOfDecimals));
};

export async function transferETH(options: ETHTransferOptions) {
  const trx = {
    gasLimit,
    gasPrice: utils.bigNumberify(gasPrice),
    value: utils.parseEther(amount.toString()),
    to,
  };
  wallet.provider = providers.getDefaultProvider(NETWORK_PROVIDER);
  return await wallet.sendTransaction(trx);
}

// Fetch methods are temporary until the BCX API provided

export async function fetchETHBalance(walletAddress: Address) {
  const provider = providers.getDefaultProvider(NETWORK_PROVIDER);
  return await provider.getBalance(walletAddress).then(utils.formatEther);
}

export async function fetchERC20Balance(walletAddress: Address, contractAddress: Address) {
  const provider = providers.getDefaultProvider(NETWORK_PROVIDER);
  const contract = new Contract(contractAddress, CONTRACT_ABI, provider);
  return await contract.balanceOf(walletAddress).then(utils.formatEther);
}
