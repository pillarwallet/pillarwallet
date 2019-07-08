// @flow

export type BitcoinTransactionTarget = {
  address: string,
  value: number,
  isChange?: boolean,
};

export type BitcoinUtxo = {
  address: string,
  txid: string,
  vout: number,
  scriptPubKey: string,
  amount: number,
  satoshis: number,
  height: number,
  confirmations: number,
};

export type BitcoinTransactionPlan = {
  inputs: BitcoinUtxo[],
  outputs: BitcoinTransactionTarget[],
  fee: number,
  isValid: boolean,
};

export type BitcoinAddress = {
  address: string,
  updatedAt: number,
};
