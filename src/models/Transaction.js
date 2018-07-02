// @flow

export type Transaction = {
  _id: string,
  transaction: Object,
  hash: string,
  to: string,
  from: string,
  timestamp: number,
  asset: string,
  nbConfirmations: number,
  gasUsed: number,
  status: string,
  value: number,
  __v: number,
  receipt: Object
}

export type TransactionPayload = {
  gasLimit: number,
  amount: number,
  to: string,
  gasPrice: number,
  txFeeInWei: number,
  symbol: string,
  contractAddress: ?string,
}

export type TransactionEthers = {
  from: string,
  hash: string,
  to: string,
  value: number,
  gasPrice: Object,
  gasLimit: Object,
  asset: string,
}
