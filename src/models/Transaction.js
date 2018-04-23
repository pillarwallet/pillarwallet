// @flow

export type Transaction = {
  _id: string,
  transaction: Object,
  hash: string,
  to: string,
  from: string,
  tmstmp: Date,
  asset: string,
  nbConfirmations: number,
  status: string,
  value: number,
  __v: number,
  receipt: Object
}