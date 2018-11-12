// @flow

export type Transaction = {
  _id: string,
  transaction: Object,
  hash: string,
  to: string,
  from: string,
  createdAt: number,
  asset: string,
  nbConfirmations: number,
  gasUsed: number,
  gasPrice: number,
  status: string,
  value: string,
  __v: number,
  receipt: Object,
  note: ?string
}

export type TransactionPayload = {
  gasLimit: number,
  amount: number,
  to: string,
  gasPrice: number,
  txFeeInWei: number,
  symbol: string,
  contractAddress: ?string,
  decimals: number,
  note: ?string
}

export type TransactionEthers = {
  from: string,
  hash: string,
  to: string,
  value: Object,
  gasPrice: Object,
  gasLimit: Object,
  asset: string,
  note: ?string
}
