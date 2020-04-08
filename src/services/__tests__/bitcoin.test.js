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
  keyPairAddress,
  rootFromMnemonic,
  collectOutputs,
  transactionFromPlan,
  sendRawTransaction,
} from 'services/bitcoin';
import type {
  BitcoinUtxo,
  BitcoinTransactionTarget,
  BitcoinTransactionPlan,
} from 'models/Bitcoin';
import { SPEED_TYPES } from 'constants/assetsConstants';


const mnemonic = 'some super random words';
const address = 'mhQ51TfiyTdwxYDq42Wrz1LvLY7PbSEJ9w';
const unspent: BitcoinUtxo[] = [
  {
    address,
    mintTxid: '2d742aa8409ee4cd8afcb2f59aac6ede47b478fafbca2335c9c04c6aedf94c9b',
    mintIndex: 0,
    scriptPubKey: '76a9146d622b371423d2e450c19d98059867d71e6aa87c88ac',
    value: 130000000,
    height: 1180957,
    confirmations: 14,
  },
  {
    address,
    mintTxid: '2d742aa8409ee4cd8afcb2f59aac6ede47b478fafbca2335c9c04c6aedf94c8b',
    mintIndex: 1,
    scriptPubKey: '76a9146d622b371423d2e450c19d98059867d71e6aa87c88ac',
    value: 90000000,
    height: 1180957,
    confirmations: 9,
  },
];

describe('bitcoin service', () => {
  const network = 'testnet';

  describe('sendRawTransaction', () => {
    describe('when transaction fails', () => {
      it('returns null', async () => {
        const resultTxid = await sendRawTransaction('<invalid>');

        expect(resultTxid).toEqual(null);
      });
    });

    it('returns the txid', async () => {
      const txid = '2d742aa8409ee4cd8afcb2f59aac6ede47b478fafbca2335c9c04c6aedf94c9b';

      const sampleTx =
        '01000000010ed79892705baae18a0a1db042a7347b6b2a3dac6cc90573caeaeec710f7bd29010000006' +
        'b483045022100aab666740917393a1f3ae4ee047ae04dfeef846f46b74c85221be2b3f90b8e46022016' +
        'b6a06079974b8b89b168642f7cf8c0e3f9c4d79389a5af37f2ab58b4c310b6012102f19b94963d08b6e' +
        '553e36a13f244c177c1b868e696f01049454a846ff7c3ed3bffffffff02801a0600000000001976a914' +
        '16820e3913b22035ff39a4076d20a73b7191123888accefb0800000000001976a91414a2f1bf167a783' +
        '5c98510fbe79c48d52fa16c6088ac00000000';

      const resultTxid = await sendRawTransaction(sampleTx);
      expect(resultTxid).toEqual(txid);
    });
  });

  describe('transactionFromPlan', () => {
    const utxos: BitcoinUtxo[] = [
      {
        address: 'mhQ51TfiyTdwxYDq42Wrz1LvLY7PbSEJ9w',
        mintTxid: '29bdf710c7eeeaca7305c96cac3d2a6b7b34a742b01d0a8ae1aa5b709298d70e',
        mintIndex: 1,
        scriptPubKey: '76a91414a2f1bf167a7835c98510fbe79c48d52fa16c6088ac',
        value: 1000000,
        height: 1570786,
        confirmations: 15,
      },
    ];

    it('works', async () => {
      const targetRoot = await rootFromMnemonic('target mnemonic', network);
      const targets: BitcoinTransactionTarget[] = [
        { address: keyPairAddress(targetRoot) || '', value: 40000 },
      ];

      const root = await rootFromMnemonic(mnemonic, network);

      const plan: BitcoinTransactionPlan = {
        inputs: utxos,
        outputs: targets,
      };

      const rawTransaction = transactionFromPlan(plan, () => {
        return root;
      }, network);

      expect(rawTransaction).toEqual(
        '01000000010ed79892705baae18a0a1db042a7347b6b2a3dac6cc90573caeaeec710f7bd29010000006' +
        'b483045022100dcc08ea6c74b2d2ddb36f7dc3c8cf2e4ab45ddecdef527a87d4bcd4a5c8ff9b00220270' +
        'b93d079adb9b9dc981098262c074e5084a7e3ea79938b86ca0a02bf271530012102f19b94963d08b6e55' +
        '3e36a13f244c177c1b868e696f01049454a846ff7c3ed3bffffffff01409c0000000000001976a914168' +
        '20e3913b22035ff39a4076d20a73b7191123888ac00000000',
      );
    });
  });

  describe('collectOutputs', () => {
    describe('when one is enough', () => {
      const sendAmount = 4000000;
      const targets: BitcoinTransactionTarget[] = [
        { address, value: sendAmount },
      ];

      it('returns an output for change', () => {
        const collected = collectOutputs(targets, SPEED_TYPES.SLOW, unspent, () => 'change');

        expect(collected).toMatchObject({
          isValid: true,
          inputs: [
            {
              address,
              mintTxid: '2d742aa8409ee4cd8afcb2f59aac6ede47b478fafbca2335c9c04c6aedf94c9b',
              mintIndex: 0,
              scriptPubKey: '76a9146d622b371423d2e450c19d98059867d71e6aa87c88ac',
              value: 130000000,
              height: 1180957,
              confirmations: 14,
            },
          ],
          outputs: [
            { address, value: sendAmount, isChange: false },
            {
              address: 'change',
              value: 130000000 - (collected.fee || 0) - sendAmount,
              isChange: true,
            },
          ],
        });
      });

      it('outputs and fee matches the input', () => {
        const { inputs, fee, outputs } = collectOutputs(targets, SPEED_TYPES.SLOW, unspent, () => 'change');

        const output = outputs.reduce(
          (acc: number, transaction: BitcoinTransactionTarget): number => {
            return acc + transaction.value;
          },
          0,
        );
        const input = inputs.reduce(
          (acc: number, utxo: BitcoinUtxo): number => {
            return acc + utxo.value;
          },
          0,
        );

        expect(output + fee).toEqual(input);
      });
    });
  });

  describe('rootFromMnemonic', () => {
    it('returns a root node', async () => {
      const root = await rootFromMnemonic(mnemonic);

      expect(keyPairAddress(root)).toEqual('mhQ51TfiyTdwxYDq42Wrz1LvLY7PbSEJ9w');
    });

    it('can be used to derive an address', async () => {
      const root = await rootFromMnemonic(mnemonic);
      const keyPair = root.derivePath("m/49'/1/0");
      const derivedAddress = keyPairAddress(keyPair);

      expect(derivedAddress).toEqual('mzhBnfzkgEMpKMn7VrZCi7JQ2Sn7wwfV9w');
    });

    it('returns same values each time', async () => {
      const root1 = await rootFromMnemonic(mnemonic);
      const root2 = await rootFromMnemonic(mnemonic);

      const keyPair1 = root1.derivePath("m/49'/1/0");
      const keyPair2 = root2.derivePath("m/49'/1/0");

      const address1 = keyPairAddress(keyPair1);
      const address2 = keyPairAddress(keyPair2);

      expect(address1).toEqual(address2);
    });

    it('has consistent address derivation for BIP44', async () => {
      const root = await rootFromMnemonic(mnemonic, 'testnet');

      expect(root.toWIF())
        .toEqual('cVA5PZZkVcgdDAEmWuiBXiLh7abCyq6amQ3gT3avwj6wtMtV3VDK');

      expect(root.toBase58()).toEqual(
        'tprv8ZgxMBicQKsPdN5wuuQH5xExXChNkkyV4HLSQeHaX2ceNcUg5o8' +
        'koiUopqC8zS4znezXLP6d8rauuHZ5S72RBLGxpZWVFmvWsPXovD9W3vA',
      );

      expect(root.neutered().toBase58()).toEqual(
        'tpubD6NzVbkrYhZ4Wq7joZ4sVMu56EDJv6APdawDhAKswJR3D6jSiBx' +
        'LzD6fzxFtqYai64eCh1UDFRBbp2e47n5JMnHy5NFYpSMvFt2dEGmp586',
      );

      // First address
      expect(keyPairAddress(root.derivePath("m/44'/0'/0'/0/0")))
        .toEqual('mrheHgyAsL496PvTWVs62zCHCbJCE6bwBU');

      // Second address
      expect(keyPairAddress(root.derivePath("m/44'/0'/0'/0/1")))
        .toEqual('my9Q51F7WAEukyn4HMKDc2UZ8D8SkiPVdU');

      // First change address
      expect(keyPairAddress(root.derivePath("m/44'/0'/0'/1/0")))
        .toEqual('mraHVKSGgkoKx1xCQnnca4skToALVCsFeu');

      // Second change address
      expect(keyPairAddress(root.derivePath("m/44'/0'/0'/1/1")))
        .toEqual('mrKZLUvTBnZFwY3gXJW8AGrotcPvJPnYYL');
    });

    it('has consistent address derivation', async () => {
      const root = await rootFromMnemonic(mnemonic, 'testnet');

      expect(root.toWIF())
        .toEqual('cVA5PZZkVcgdDAEmWuiBXiLh7abCyq6amQ3gT3avwj6wtMtV3VDK');

      expect(root.toBase58()).toEqual(
        'tprv8ZgxMBicQKsPdN5wuuQH5xExXChNkkyV4HLSQeHaX2ceNcUg5o8' +
        'koiUopqC8zS4znezXLP6d8rauuHZ5S72RBLGxpZWVFmvWsPXovD9W3vA',
      );

      expect(root.neutered().toBase58()).toEqual(
        'tpubD6NzVbkrYhZ4Wq7joZ4sVMu56EDJv6APdawDhAKswJR3D6jSiBx' +
        'LzD6fzxFtqYai64eCh1UDFRBbp2e47n5JMnHy5NFYpSMvFt2dEGmp586',
      );

      expect(keyPairAddress(root.derivePath('m/44\'/60\'/0\'/0')))
        .toEqual('miVfBxLzerTXpaFcQwFaPcGACzRCFBp1zb');

      expect(keyPairAddress(root.derivePath('m/44\'/60\'/0\'/1')))
        .toEqual('mw41t6u54dPGUG9u5LNH4w63EXPG2hCqh1');

      expect(keyPairAddress(root.derivePath('m/44\'/60\'/0\'/2')))
        .toEqual('mybAueCX97uxipj7veAiD6zarquTP971ZH');

      expect(keyPairAddress(root.derivePath('m/44\'/60\'/0\'/3')))
        .toEqual('mwUa113C72XD2fUEp5U2kCuGkm47wgRTaR');

      expect(keyPairAddress(root.derivePath('m/44\'/60\'/0\'/4')))
        .toEqual('mgcZyTjAeWrFRZsFJZRW4vJqeWVmVtW4Hc');
    });
  });

  describe('keyPairAddress', () => {
    it('returns same address for same pair', async () => {
      const root = await rootFromMnemonic(mnemonic);

      const keyPair = root.derivePath("m/49'/1/0");

      const address1 = keyPairAddress(keyPair);
      const address2 = keyPairAddress(keyPair);

      expect(address1).toEqual(address2);
    });
  });
});
