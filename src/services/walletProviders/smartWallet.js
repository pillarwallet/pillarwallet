// @flow
import { ethToWei } from '@netgum/utils';
import { utils } from 'ethers';
import abi from 'ethjs-abi';
import { COLLECTIBLES_NETWORK } from 'react-native-dotenv';
import ERC20_CONTRACT_ABI from 'abi/erc20.json';
import ERC721_CONTRACT_ABI_SAFE_TRANSFER_FROM from 'abi/erc721_safeTransferFrom';
import ERC721_CONTRACT_ABI from 'abi/erc721';
import ERC721_CONTRACT_ABI_TRANSFER_FROM from 'abi/erc721_transferFrom';
import { ETH } from 'constants/assetsConstants';
import type { Account } from 'models/Account';
import type { CollectibleTransactionPayload, TokenTransactionPayload } from 'models/Transaction';
import { getERC721ContractTransferMethod } from 'services/assets';
import SmartWalletService from 'services/smartWallet';
import { getEthereumProvider } from 'utils/common';
import { getAccountAddress } from 'utils/accounts';
import { catchTransactionError } from 'utils/wallet';


export default class SmartWalletProvider {
  wallet: Object;
  smartWalletService: SmartWalletService;
  sdkInitialized: boolean = false;
  sdkInitPromise: Promise<any>;

  constructor(privateKey: string, account: Account) {
    this.smartWalletService = new SmartWalletService();
    this.sdkInitPromise = this.smartWalletService
      .init(privateKey)
      .then(() => this.smartWalletService.connectAccount(account.id))
      .then(() => { this.sdkInitialized = true; })
      .catch(() => null);
  }

  getInitStatus() {
    return this.sdkInitPromise;
  }

  async transferETH(account: Account, transaction: TokenTransactionPayload) {
    // TODO: connect transactionSpeed selector from the UI
    if (!this.sdkInitialized) {
      return Promise.reject(new Error('SDK is not initialized'));
    }

    const { to, amount } = transaction;
    const from = getAccountAddress(account);
    const value = ethToWei(amount);

    return this.smartWalletService
      .transferAsset({
        recipient: to,
        value,
        data: '',
        // transactionSpeed
      })
      .then(hash => ({
        from,
        hash,
        to,
        value,
      }))
      .catch((e) => catchTransactionError(e, ETH, {
        to,
        amount,
        value,
      }));
  }

  async transferERC20(account: Account, transaction: TokenTransactionPayload) {
    // TODO: connect transactionSpeed selector from the UI
    if (!this.sdkInitialized) {
      return Promise.reject(new Error('SDK is not initialized'));
    }

    const {
      to,
      amount,
      contractAddress,
      decimals = 18,
    } = transaction;
    const from = getAccountAddress(account);

    const value = decimals > 0
      ? utils.parseUnits(amount.toString(), decimals)
      : utils.bigNumberify(amount.toString());

    const transferMethod = ERC20_CONTRACT_ABI.find(item => item.name === 'transfer');
    const data = abi.encodeMethod(transferMethod, [to, value]);

    return this.smartWalletService
      .transferAsset({
        // $FlowFixMe
        recipient: contractAddress,
        value,
        data,
        // transactionSpeed
      })
      .then(hash => ({
        from,
        hash,
        to,
        value,
      }))
      .catch((e) => catchTransactionError(e, 'ERC20', {
        decimals,
        contractAddress,
        to,
        amount,
        value,
        data,
      }));
  }

  async transferERC721(account: Account, transaction: CollectibleTransactionPayload) {
    if (!this.sdkInitialized) {
      return Promise.reject(new Error('SDK is not initialized'));
    }

    const { to, contractAddress, tokenId } = transaction;
    const from = getAccountAddress(account);

    let data = '';
    let transferMethodSignature;
    let contractAbi;
    const provider = getEthereumProvider(COLLECTIBLES_NETWORK);
    const contractCode = await provider.getCode(contractAddress);
    const contractTransferMethod = getERC721ContractTransferMethod(contractCode);

    switch (contractTransferMethod) {
      case 'safeTransferFrom':
        contractAbi = ERC721_CONTRACT_ABI_SAFE_TRANSFER_FROM;
        transferMethodSignature = contractAbi.find(item => item.name === contractTransferMethod);
        data = abi.encodeMethod(transferMethodSignature, [from, to, tokenId]);
        break;
      case 'transfer':
        contractAbi = ERC721_CONTRACT_ABI;
        transferMethodSignature = contractAbi.find(item => item.name === contractTransferMethod);
        data = abi.encodeMethod(transferMethodSignature, [to, tokenId]);
        break;
      case 'transferFrom':
        contractAbi = ERC721_CONTRACT_ABI_TRANSFER_FROM;
        transferMethodSignature = contractAbi.find(item => item.name === contractTransferMethod);
        data = abi.encodeMethod(transferMethodSignature, [from, to, tokenId]);
        break;
      default:
    }

    return this.smartWalletService
      .transferAsset({
        // $FlowFixMe
        recipient: contractAddress,
        value: 0,
        data,
        // transactionSpeed
      })
      .then(hash => ({
        from,
        hash,
        to,
        tokenId,
        value: 0,
      }))
      .catch((e) => catchTransactionError(e, 'ERC721', {
        contractAddress,
        from,
        to,
        tokenId,
      }));
  }
}
