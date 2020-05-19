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
export type TxSettlementItem = {
  symbol: string,
  value: string | number,
  hash: string,
};

type TxWithdrawalExtra = {
  paymentHash: string,
};

type EnsTransactionExtra = {
  ensName: string,
};

export type SyntheticTransaction = {
  transactionId: string,
  fromAmount: number,
  toAmount: number,
  toAssetCode: string,
  toAddress: string,
  receiverEnsName?: string,
};

export type SyntheticTransactionExtra = {
  syntheticTransaction: $Shape<SyntheticTransaction>,
};

export type TransactionExtra = TxSettlementItem[] | TxWithdrawalExtra | SyntheticTransactionExtra | EnsTransactionExtra;

export type GasToken = {
  address: string,
  decimals: number,
  symbol: string,
};

export type FeeWithGasToken = {
  feeInWei: number,
  gasToken: GasToken,
};

export type Transaction = {
  _id: string,
  hash: string,
  to: string,
  from: string,
  createdAt: number,
  asset: string,
  nbConfirmations?: number,
  gasUsed?: number,
  gasPrice?: number,
  status: string,
  value: string,
  note?: ?string,
  signOnly?: ?boolean,
  isPPNTransaction?: boolean,
  tag?: string,
  extra?: TransactionExtra,
  stateInPPN?: string,
  feeWithGasToken?: ?FeeWithGasToken,
}

export type TransactionsStore = {
  [accountId: string]: Transaction[],
};

export type TokenTransactionPayload = {
  gasLimit: number,
  amount: number | string,
  to: string,
  receiverEnsName?: string,
  gasPrice: number,
  txFeeInWei: number,
  txSpeed?: string,
  symbol: string,
  contractAddress: string,
  decimals: number,
  note?: ?string,
  name?: string,
  tokenId?: string,
  signOnly?: ?boolean,
  signedHash?: ?string,
  data?: string,
  extra?: Object,
  usePPN?: boolean,
  gasToken?: ?GasToken,
}

export type CollectibleTransactionPayload = {
  to: string,
  receiverEnsName?: string,
  name: string,
  contractAddress: ?string,
  tokenType: string,
  tokenId: string,
  note?: ?string,
  signOnly?: ?boolean,
  signedHash?: ?string,
  gasPrice?: ?number,
  gasLimit?: ?number,
  txSpeed?: string,
  gasToken?: ?GasToken,
  txFeeInWei: number,
}

export type TransactionPayload = TokenTransactionPayload | CollectibleTransactionPayload;

export type TransactionEthers = {
  from: string,
  hash: string,
  to: string,
  value: string | Object,
  gasPrice?: Object | number,
  gasLimit?: Object | number,
  asset: string,
  note?: ?string,
  status?: string,
  createdAt?: number,
  isPPNTransaction?: boolean,
  tag?: string,
  extra?: TransactionExtra,
  stateInPPN?: string,
  feeWithGasToken?: ?FeeWithGasToken,
};
