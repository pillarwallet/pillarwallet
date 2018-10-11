// @flow

export type GasPrice = {
  min?: number,
  avg?: number,
  max?: number,
}

export type GasInfo = {
  gasPrice: GasPrice,
  isFetched: boolean,
}
