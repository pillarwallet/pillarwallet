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
import {
  ECPair,
  payments,
  networks,
  TransactionBuilder,
} from 'bitcoinjs-lib';
import { DEFAULT_BTC_NETWORK } from 'constants/bitcoinConstants';
import type {
  BitcoinUtxo,
  BitcoinTransactionTarget,
  BitcoinTransactionPlan,
} from 'models/Bitcoin';
import { SPEED_TYPES } from 'constants/assetsConstants';
import {
  getAddressUtxosFromNode,
  sendRawTransactionToNode,
} from 'services/insight';

const bip39 = require('bip39');
const bip32 = require('bip32');
const coinselect = require('coinselect');

const NETWORK = networks[DEFAULT_BTC_NETWORK];

const feeRateFromSpeed = (speed: string): number => {
  switch (speed) {
    // TODO: define rates
    case SPEED_TYPES.SLOW: return 50;
    case SPEED_TYPES.NORMAL: return 50;
    case SPEED_TYPES.FAST: return 50;
    default: return 50;
  }
};

export const collectOutputs = (
  targets: BitcoinTransactionTarget[],
  speed: string,
  unspent: BitcoinUtxo[],
  changeAddress: (value: number) => string,
): BitcoinTransactionPlan => {
  const feeRate = feeRateFromSpeed(speed);

  const utxos = unspent.map(utxo => ({ ...utxo, value: utxo.satoshis }));
  const {
    inputs,
    outputs,
    fee,
  } = coinselect(utxos, targets, feeRate);

  const isValid = !!(inputs && outputs);

  const planOutputs = isValid ? outputs.map(out => {
    if (out.address) {
      return { ...out, isChange: false };
    }
    const address = changeAddress(out.value);

    return { ...out, address, isChange: true };
  }) : [];
  const planInputs = isValid ? inputs : [];

  return {
    fee,
    isValid,
    inputs: planInputs,
    outputs: planOutputs,
  };
};

export const sendRawTransaction = async (rawTx: string): Promise<string> => {
  return sendRawTransactionToNode(rawTx)
    .then(response => response.json())
    .then(({ txid }) => txid)
    .catch(() => null);
};

export const transactionFromPlan = (
  plan: BitcoinTransactionPlan,
  inputSigner: (address: string) => ECPair,
  networkName?: string,
): string => {
  const network = networkName ? networks[networkName] : NETWORK;

  const txb = new TransactionBuilder(network);
  txb.setVersion(1);

  plan.inputs.forEach(utxo => {
    txb.addInput(
      utxo.txid,
      utxo.vout,
    );
  });
  plan.outputs.forEach(out => {
    txb.addOutput(out.address, out.value);
  });

  let utxoIndex = 0;
  plan.inputs.forEach(({ address }) => {
    const keyPair = inputSigner(address);

    txb.sign({
      keyPair,
      prevOutScriptType: 'p2pkh',
      vin: utxoIndex++,
    });
  });

  return txb.build().toHex();
};

export const rootFromMnemonic = async (mnemonic: string, networkName?: string): ECPair => {
  const network = networkName ? networks[networkName] : NETWORK;
  const seed = await bip39.mnemonicToSeed(mnemonic);

  return bip32.fromSeed(seed, network);
};

export const keyPairAddress = (keyPair: ECPair): string => {
  const { address } = payments.p2pkh({
    pubkey: keyPair.publicKey,
    network: keyPair.network,
  });

  return address;
};

export const importKeyPair = (s: string, networkName?: string): ECPair => {
  const network = networkName ? networks[networkName] : NETWORK;

  return ECPair.fromWIF(s, network);
};

export const exportKeyPair = (keyPair: ECPair): string => {
  return keyPair.toWIF();
};

export const getAddressUtxos = (address: string): Promise<BitcoinUtxo[]> => {
  return getAddressUtxosFromNode(address)
    .then(response => response.json())
    .catch(error => ({ error }));
};
