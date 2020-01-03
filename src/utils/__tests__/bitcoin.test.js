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
import { extractBitcoinTransactions } from 'utils/bitcoin';

describe('Bitcoin utils', () => {
  describe('extractBitcoinTransactions()', () => {
    const mockAddress = 'x1';
    const mockTXResult = [
      {
        _id: '5ddcfa19b2cb5eecc49b5566',
        hash: '2ecdd9a637b3b3d4584a09097566e0d028bc48da8b71e7d3f1f291a2897a462b',
        to: mockAddress,
        from: '2N9qAgGyvvSVJRGWvsseW13z9HuyvHnU3mo',
        createdAt: 1574763033.958,
        asset: 'BTC',
        btcFee: 168,
        nbConfirmations: 0,
        status: 'pending',
        value: 1000000,
        isPPNTransaction: false,
        type: 'transactionEvent',
      },
      {
        _id: '5ddceefdb2cb5eecc48d8514',
        hash: '56eea37c7a6e0e706d9922c46fa02b9e514ba7bc34092b79e0e30b1f71570d45',
        to: '2N1FZJxTbnN4qbtgrki4f2wrCaC9qogxHox',
        from: mockAddress,
        createdAt: 1574760189.36,
        asset: 'BTC',
        btcFee: 19367,
        nbConfirmations: 0,
        status: 'pending',
        value: 2649070,
        isPPNTransaction: false,
        type: 'transactionEvent',
      },
    ];

    const mockTxs = [
      {
        _id: '5ddcfa19b2cb5eecc49b5566',
        chain: 'BTC',
        network: 'testnet',
        coinbase: false,
        mintIndex: 0,
        spentTxid: '',
        mintTxid: '2ecdd9a637b3b3d4584a09097566e0d028bc48da8b71e7d3f1f291a2897a462b',
        mintHeight: 1609856,
        spentHeight: -2,
        address: 'mi8YXVUVAQrSx2KCST62KcCAuwjv9b8n5G',
        script: '76a9141cab62a9afad8154fcb813fba486a4e1f845af3d88ac',
        value: 1000000,
        confirmations: -1,
        details: {
          _id: '5ddcfa19b2cb5eecc49b5586',
          txid: '2ecdd9a637b3b3d4584a09097566e0d028bc48da8b71e7d3f1f291a2897a462b',
          network: 'testnet',
          chain: 'BTC',
          blockHeight: -1,
          blockHash: '',
          blockTime: '2019-11-26T10:10:33.958Z',
          blockTimeNormalized: '2019-11-26T10:10:33.958Z',
          coinbase: false,
          locktime: 1609854,
          inputCount: 1,
          outputCount: 2,
          size: 140,
          fee: 168,
          value: 4299832,
          confirmations: 0,
          coins: {
            inputs: [
              {
                _id: '5ddcf7b3b2cb5eecc4985995',
                chain: 'BTC',
                network: 'testnet',
                coinbase: false,
                mintIndex: 23,
                spentTxid: '2ecdd9a637b3b3d4584a09097566e0d028bc48da8b71e7d3f1f291a2897a462b',
                mintTxid: '01fed78bbf178ec4e7bd4ba399f49bc8c1f6ef12188f6bf367117f194e74942f',
                mintHeight: 1609853,
                spentHeight: -1,
                address: '2N9qAgGyvvSVJRGWvsseW13z9HuyvHnU3mo',
                script: 'a914b5ed644cb29594a1715de4efb7acb566e1e140dc87',
                value: 4300000,
                confirmations: -1,
                sequenceNumber: 4294967294,
              },
            ],
            outputs: [
              {
                _id: '5ddcfa19b2cb5eecc49b5566',
                chain: 'BTC',
                network: 'testnet',
                coinbase: false,
                mintIndex: 0,
                spentTxid: '',
                mintTxid: '2ecdd9a637b3b3d4584a09097566e0d028bc48da8b71e7d3f1f291a2897a462b',
                mintHeight: -1,
                spentHeight: -2,
                address: mockAddress,
                script: '76a9141cab62a9afad8154fcb813fba486a4e1f845af3d88ac',
                value: 1000000,
                confirmations: -1,
              },
              {
                _id: '5ddcfa19b2cb5eecc49b5567',
                chain: 'BTC',
                network: 'testnet',
                coinbase: false,
                mintIndex: 1,
                spentTxid: '',
                mintTxid: '2ecdd9a637b3b3d4584a09097566e0d028bc48da8b71e7d3f1f291a2897a462b',
                mintHeight: -1,
                spentHeight: -2,
                address: '2N7TyRzRx1BxZ11igaKTF46HtKo2hFt6sJF',
                script: 'a9149bfb046026e40f95e528960aead3208ffdcbb18f87',
                value: 3299832,
                confirmations: -1,
              },
            ],
          },
        },
      },
      {
        _id: '5ddceefdb2cb5eecc48d8514',
        chain: 'BTC',
        network: 'testnet',
        coinbase: false,
        mintIndex: 1,
        spentTxid: '',
        mintTxid: '56eea37c7a6e0e706d9922c46fa02b9e514ba7bc34092b79e0e30b1f71570d45',
        mintHeight: 1609845,
        spentHeight: -2,
        address: 'mi8YXVUVAQrSx2KCST62KcCAuwjv9b8n5G',
        script: '76a9141cab62a9afad8154fcb813fba486a4e1f845af3d88ac',
        value: 2649070,
        confirmations: -1,
        details: {
          _id: '5ddceefdb2cb5eecc48d864a',
          txid: '56eea37c7a6e0e706d9922c46fa02b9e514ba7bc34092b79e0e30b1f71570d45',
          network: 'testnet',
          chain: 'BTC',
          blockHeight: -1,
          blockHash: '',
          blockTime: '2019-11-26T09:23:09.360Z',
          blockTimeNormalized: '2019-11-26T09:23:09.360Z',
          coinbase: false,
          locktime: 1609844,
          inputCount: 1,
          outputCount: 2,
          size: 140,
          fee: 19367,
          value: 1381831863,
          confirmations: 0,
          coins: {
            inputs: [
              {
                _id: '5ddced5cb2cb5eecc48b654c',
                chain: 'BTC',
                network: 'testnet',
                coinbase: false,
                mintIndex: 0,
                spentTxid: '56eea37c7a6e0e706d9922c46fa02b9e514ba7bc34092b79e0e30b1f71570d45',
                mintTxid: '62e6f5dd1a864edc5d7a32395dee183faaabb8a496ec5dc6b062952b6f358264',
                mintHeight: 1609844,
                spentHeight: -1,
                address: mockAddress,
                script: 'a91457d122aaf4768b0676d5b9c2b55e6f5bf9d4b13e87',
                value: 1381851230,
                confirmations: -1,
                sequenceNumber: 4294967294,
              },
            ],
            outputs: [
              {
                _id: '5ddceefdb2cb5eecc48d8515',
                chain: 'BTC',
                network: 'testnet',
                coinbase: false,
                mintIndex: 0,
                spentTxid: '',
                mintTxid: '56eea37c7a6e0e706d9922c46fa02b9e514ba7bc34092b79e0e30b1f71570d45',
                mintHeight: -1,
                spentHeight: -2,
                address: '2N1FZJxTbnN4qbtgrki4f2wrCaC9qogxHox',
                script: 'a9149e762db90981a830f7b9570ac70e080c04f4e3b587',
                value: 2649070,
                confirmations: -1,
              },
              {
                _id: '5ddceefdb2cb5eecc48d8514',
                chain: 'BTC',
                network: 'testnet',
                coinbase: false,
                mintIndex: 1,
                spentTxid: '',
                mintTxid: '56eea37c7a6e0e706d9922c46fa02b9e514ba7bc34092b79e0e30b1f71570d45',
                mintHeight: -1,
                spentHeight: -2,
                address: mockAddress,
                script: '76a9141cab62a9afad8154fcb813fba486a4e1f845af3d88ac',
                value: 1379182793,
                confirmations: -1,
              },
            ],
          },
        },
      },
    ];

    it('returns all transactions derived from a list of address transactions', () => {
      const result = extractBitcoinTransactions(mockAddress, mockTxs);
      expect(result).toEqual(mockTXResult);
    });
  });
});
