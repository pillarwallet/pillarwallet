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
import * as React from 'react';
import { BigNumber } from 'bignumber.js';
import { storiesOf } from '@storybook/react-native';

// Constants
import { CHAIN } from 'constants/chainConstants';
import { ADDRESS_ZERO } from 'constants/assetsConstants';

// Types
import { EVENT_TYPE, TRANSACTION_STATUS, type Event } from 'models/History';

// Local
import WithThemeDecorator from '../../../storybook/WithThemeDecorator';
import HistoryList from './HistoryList';


// cannot import from test utils, bundler fails
export const mockPlrAddress = '0xe3818504c1b32bf1557b16c238b2e01fd3149c17';
export const mockEthAddress = ADDRESS_ZERO;

const stories = storiesOf('HistoryList', module).addDecorator(WithThemeDecorator);

stories.add('basic transactions', () => {
  return <HistoryList items={basicItems} chain={CHAIN.ETHEREUM} />;
});

const basicItems: Event[] = [
  // Token received
  {
    type: EVENT_TYPE.TOKEN_RECEIVED,
    id: '0xb0da60fa0c07d8b8f5636f8bf02216dd4235d6d8f9e76c058c07d6a9f494670c',
    hash: '0xb0da60fa0c07d8b8f5636f8bf02216dd4235d6d8f9e76c058c07d6a9f494670c',
    date: new Date('2021-04-14'),
    fromAddress: '0x02C191aE18171C41D6138CBa0a10dAA25C653FB8',
    toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    value: {
      value: BigNumber(4.2),
      symbol: 'ETH',
      address: mockEthAddress,
    },
    status: TRANSACTION_STATUS.CONFIRMED,
  },
  {
    type: EVENT_TYPE.TOKEN_RECEIVED,
    id: '0xb0da60fa0c07d8b8f5636f8bf02216dd4235d6d8f9e76c058c07d6a9f494670c',
    hash: '0xb0da60fa0c07d8b8f5636f8bf02216dd4235d6d8f9e76c058c07d6a9f494670c',
    date: new Date('2021-04-14'),
    fromAddress: '0x02C191aE18171C41D6138CBa0a10dAA25C653FB8',
    toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    value: {
      value: BigNumber(4.2),
      symbol: 'ETH',
      address: mockEthAddress,
    },
    status: TRANSACTION_STATUS.PENDING,
  },
  {
    type: EVENT_TYPE.TOKEN_RECEIVED,
    id: '0xb0da60fa0c07d8b8f5636f8bf02216dd4235d6d8f9e76c058c07d6a9f494670c',
    hash: '0xb0da60fa0c07d8b8f5636f8bf02216dd4235d6d8f9e76c058c07d6a9f494670c',
    date: new Date('2021-04-14'),
    fromAddress: '0x02C191aE18171C41D6138CBa0a10dAA25C653FB8',
    toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    value: {
      value: BigNumber(4.2),
      symbol: 'ETH',
      address: mockEthAddress,
    },
    status: TRANSACTION_STATUS.FAILED,
  },
  {
    type: EVENT_TYPE.TOKEN_RECEIVED,
    id: '0xb0da60fa0c07d8b8f5636f8bf02216dd4235d6d8f9e76c058c07d6a9f494670c',
    hash: '0xb0da60fa0c07d8b8f5636f8bf02216dd4235d6d8f9e76c058c07d6a9f494670c',
    date: new Date('2021-04-14'),
    fromAddress: '0x02C191aE18171C41D6138CBa0a10dAA25C653FB8',
    toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    value: {
      value: BigNumber(4.2),
      symbol: 'ETH',
      address: mockEthAddress,
    },
    status: TRANSACTION_STATUS.TIMEDOUT,
  },
  // TOKEN Send
  {
    type: EVENT_TYPE.TOKEN_SENT,
    id: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    date: new Date('2021-04-13'),
    fromAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    toAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
    value: {
      value: BigNumber(100),
      symbol: 'PLR',
      address: mockPlrAddress,
    },
    fee: {
      value: BigNumber(0.012345678),
      symbol: 'ETH',
      address: mockEthAddress,
    },
    status: TRANSACTION_STATUS.CONFIRMED,
  },
  {
    type: EVENT_TYPE.TOKEN_SENT,
    id: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    date: new Date('2021-04-13'),
    fromAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    toAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
    value: {
      value: BigNumber(100),
      symbol: 'PLR',
      address: mockPlrAddress,
    },
    fee: {
      value: BigNumber(0.012345678),
      symbol: 'ETH',
      address: mockEthAddress,
    },
    status: TRANSACTION_STATUS.PENDING,
  },
  {
    type: EVENT_TYPE.TOKEN_SENT,
    id: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    date: new Date('2021-04-13'),
    fromAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    toAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
    value: {
      value: BigNumber(100),
      symbol: 'PLR',
      address: mockPlrAddress,
    },
    fee: {
      value: BigNumber(0.012345678),
      symbol: 'ETH',
      address: mockEthAddress,
    },
    status: TRANSACTION_STATUS.FAILED,
  },
  {
    type: EVENT_TYPE.TOKEN_SENT,
    id: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    date: new Date('2021-04-13'),
    fromAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    toAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
    value: {
      value: BigNumber(100),
      symbol: 'PLR',
      address: mockPlrAddress,
    },
    fee: {
      value: BigNumber(0.012345678),
      symbol: 'ETH',
      address: mockEthAddress,
    },
    status: TRANSACTION_STATUS.TIMEDOUT,
  },
  // COLLECTIBLE RECEIVED
  {
    type: EVENT_TYPE.COLLECTIBLE_RECEIVED,
    date: new Date('2021-04-12'),
    id: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15123',
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    fromAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
    toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    title: 'Old Asynchronous Helmet',
    imageUrl:
      'https://lh3.googleusercontent.com/upSSwyYkXf4eMI-0QQhkx1oxgLiacjH425t7sDxDX3JFwfxMhgcwMG70oM5ZhsS4WX2LJwlsBBStSBPJcFNIONWq',
    status: TRANSACTION_STATUS.CONFIRMED,
  },
  {
    type: EVENT_TYPE.COLLECTIBLE_RECEIVED,
    date: new Date('2021-04-12'),
    id: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15123',
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    fromAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
    toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    title: 'Old Asynchronous Helmet',
    imageUrl:
      'https://lh3.googleusercontent.com/upSSwyYkXf4eMI-0QQhkx1oxgLiacjH425t7sDxDX3JFwfxMhgcwMG70oM5ZhsS4WX2LJwlsBBStSBPJcFNIONWq',
    status: TRANSACTION_STATUS.PENDING,
  },
  {
    type: EVENT_TYPE.COLLECTIBLE_RECEIVED,
    date: new Date('2021-04-12'),
    id: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15123',
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    fromAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
    toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    title: 'Old Asynchronous Helmet',
    imageUrl:
      'https://lh3.googleusercontent.com/upSSwyYkXf4eMI-0QQhkx1oxgLiacjH425t7sDxDX3JFwfxMhgcwMG70oM5ZhsS4WX2LJwlsBBStSBPJcFNIONWq',
    status: TRANSACTION_STATUS.FAILED,
  },
  {
    type: EVENT_TYPE.COLLECTIBLE_RECEIVED,
    date: new Date('2021-04-12'),
    id: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15123',
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    fromAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
    toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    title: 'Old Asynchronous Helmet',
    imageUrl:
      'https://lh3.googleusercontent.com/upSSwyYkXf4eMI-0QQhkx1oxgLiacjH425t7sDxDX3JFwfxMhgcwMG70oM5ZhsS4WX2LJwlsBBStSBPJcFNIONWq',
    status: TRANSACTION_STATUS.TIMEDOUT,
  },
  // Collectible sent
  {
    type: EVENT_TYPE.COLLECTIBLE_SENT,
    id: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15456',
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    date: new Date('2021-04-12'),
    fromAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
    toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    title: 'Old Asynchronous Helmet',
    imageUrl:
      'https://lh3.googleusercontent.com/upSSwyYkXf4eMI-0QQhkx1oxgLiacjH425t7sDxDX3JFwfxMhgcwMG70oM5ZhsS4WX2LJwlsBBStSBPJcFNIONWq',
    fee: {
      value: BigNumber(0.012345678),
      symbol: 'ETH',
      address: mockEthAddress,
    },
    status: TRANSACTION_STATUS.CONFIRMED,
  },
  {
    type: EVENT_TYPE.COLLECTIBLE_SENT,
    id: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15456',
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    date: new Date('2021-04-12'),
    fromAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
    toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    title: 'Old Asynchronous Helmet',
    imageUrl:
      'https://lh3.googleusercontent.com/upSSwyYkXf4eMI-0QQhkx1oxgLiacjH425t7sDxDX3JFwfxMhgcwMG70oM5ZhsS4WX2LJwlsBBStSBPJcFNIONWq',
    fee: {
      value: BigNumber(0.012345678),
      symbol: 'ETH',
      address: mockEthAddress,
    },
    status: TRANSACTION_STATUS.PENDING,
  },
  {
    type: EVENT_TYPE.COLLECTIBLE_SENT,
    id: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15456',
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    date: new Date('2021-04-12'),
    fromAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
    toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    title: 'Old Asynchronous Helmet',
    imageUrl:
      'https://lh3.googleusercontent.com/upSSwyYkXf4eMI-0QQhkx1oxgLiacjH425t7sDxDX3JFwfxMhgcwMG70oM5ZhsS4WX2LJwlsBBStSBPJcFNIONWq',
    fee: {
      value: BigNumber(0.012345678),
      symbol: 'ETH',
      address: mockEthAddress,
    },
    status: TRANSACTION_STATUS.FAILED,
  },
  {
    type: EVENT_TYPE.COLLECTIBLE_SENT,
    id: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15456',
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    date: new Date('2021-04-12'),
    fromAddress: '0xa3E22d8760f95E3566AbDE76EBBD8Ab660E88149',
    toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    title: 'Old Asynchronous Helmet',
    imageUrl:
      'https://lh3.googleusercontent.com/upSSwyYkXf4eMI-0QQhkx1oxgLiacjH425t7sDxDX3JFwfxMhgcwMG70oM5ZhsS4WX2LJwlsBBStSBPJcFNIONWq',
    fee: {
      value: BigNumber(0.012345678),
      symbol: 'ETH',
      address: mockEthAddress,
    },
    status: TRANSACTION_STATUS.TIMEDOUT,
  },
  // TOKEN EXCHANGE
  {
    type: EVENT_TYPE.TOKEN_EXCHANGE,
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    id: '0xb0da60fa0c07d8b8f5636f8bf02216dd4235d6d8f9e76c058c07d6a9f494670e',
    date: new Date('2021-04-19'),
    fromAddress: '0x02C191aE18171C41D6138CBa0a10dAA25C653FB8',
    toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    fromValue: { symbol: 'ETH', value: BigNumber(0.218001), address: mockEthAddress },
    toValue: { symbol: 'PLR', value: BigNumber(2500), address: mockPlrAddress },
    fee: {
      value: BigNumber(0.012345678),
      symbol: 'ETH',
      address: mockEthAddress,
    },
    status: TRANSACTION_STATUS.CONFIRMED,
  },
  {
    type: EVENT_TYPE.TOKEN_EXCHANGE,
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    id: '0xb0da60fa0c07d8b8f5636f8bf02216dd4235d6d8f9e76c058c07d6a9f494670e',
    date: new Date('2021-04-19'),
    fromAddress: '0x02C191aE18171C41D6138CBa0a10dAA25C653FB8',
    toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    fromValue: { symbol: 'ETH', value: BigNumber(0.218001), address: mockEthAddress },
    toValue: { symbol: 'PLR', value: BigNumber(2500), address: mockPlrAddress },
    fee: {
      value: BigNumber(0.012345678),
      symbol: 'ETH',
      address: mockEthAddress,
    },
    status: TRANSACTION_STATUS.PENDING,
  },
  {
    type: EVENT_TYPE.TOKEN_EXCHANGE,
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    id: '0xb0da60fa0c07d8b8f5636f8bf02216dd4235d6d8f9e76c058c07d6a9f494670e',
    date: new Date('2021-04-19'),
    fromAddress: '0x02C191aE18171C41D6138CBa0a10dAA25C653FB8',
    toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    fromValue: { symbol: 'ETH', value: BigNumber(0.218001), address: mockEthAddress },
    toValue: { symbol: 'PLR', value: BigNumber(2500), address: mockPlrAddress },
    fee: {
      value: BigNumber(0.012345678),
      symbol: 'ETH',
      address: mockEthAddress,
    },
    status: TRANSACTION_STATUS.FAILED,
  },
  {
    type: EVENT_TYPE.TOKEN_EXCHANGE,
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    id: '0xb0da60fa0c07d8b8f5636f8bf02216dd4235d6d8f9e76c058c07d6a9f494670e',
    date: new Date('2021-04-19'),
    fromAddress: '0x02C191aE18171C41D6138CBa0a10dAA25C653FB8',
    toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    fromValue: { symbol: 'ETH', value: BigNumber(0.218001), address: mockEthAddress },
    toValue: { symbol: 'PLR', value: BigNumber(2500), address: mockPlrAddress },
    fee: {
      value: BigNumber(0.012345678),
      symbol: 'ETH',
      address: mockEthAddress,
    },
    status: TRANSACTION_STATUS.TIMEDOUT,
  },
  // EXCHANGE FROM FIAT
  {
    type: EVENT_TYPE.EXCHANGE_FROM_FIAT,
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    id: '0xb0da60fa0c07d8b8f5636f8bf02216dd4235d6d8f9e76c058c07d6a9f494670d',
    date: new Date('2021-04-19'),
    fromAddress: '0x02C191aE18171C41D6138CBa0a10dAA25C653FB8',
    toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    fromValue: { currency: 'USD', value: BigNumber(154.5) },
    toValue: { symbol: 'ETH', value: BigNumber(0.65), address: mockEthAddress },
    fee: {
      value: BigNumber(0.012345678),
      symbol: 'ETH',
      address: mockEthAddress,
    },
    status: TRANSACTION_STATUS.CONFIRMED,
  },
  {
    type: EVENT_TYPE.EXCHANGE_FROM_FIAT,
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    id: '0xb0da60fa0c07d8b8f5636f8bf02216dd4235d6d8f9e76c058c07d6a9f494670d',
    date: new Date('2021-04-19'),
    fromAddress: '0x02C191aE18171C41D6138CBa0a10dAA25C653FB8',
    toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    fromValue: { currency: 'USD', value: BigNumber(154.5) },
    toValue: { symbol: 'ETH', value: BigNumber(0.65), address: mockEthAddress },
    fee: {
      value: BigNumber(0.012345678),
      symbol: 'ETH',
      address: mockEthAddress,
    },
    status: TRANSACTION_STATUS.PENDING,
  },
  {
    type: EVENT_TYPE.EXCHANGE_FROM_FIAT,
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    id: '0xb0da60fa0c07d8b8f5636f8bf02216dd4235d6d8f9e76c058c07d6a9f494670d',
    date: new Date('2021-04-19'),
    fromAddress: '0x02C191aE18171C41D6138CBa0a10dAA25C653FB8',
    toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    fromValue: { currency: 'USD', value: BigNumber(154.5) },
    toValue: { symbol: 'ETH', value: BigNumber(0.65), address: mockEthAddress },
    fee: {
      value: BigNumber(0.012345678),
      symbol: 'ETH',
      address: mockEthAddress,
    },
    status: TRANSACTION_STATUS.FAILED,
  },
  {
    type: EVENT_TYPE.EXCHANGE_FROM_FIAT,
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    id: '0xb0da60fa0c07d8b8f5636f8bf02216dd4235d6d8f9e76c058c07d6a9f494670d',
    date: new Date('2021-04-19'),
    fromAddress: '0x02C191aE18171C41D6138CBa0a10dAA25C653FB8',
    toAddress: '0x26697240DcB649A62B10764A5F41Ba13CB38b5F0',
    fromValue: { currency: 'USD', value: BigNumber(154.5) },
    toValue: { symbol: 'ETH', value: BigNumber(0.65), address: mockEthAddress },
    fee: {
      value: BigNumber(0.012345678),
      symbol: 'ETH',
      address: mockEthAddress,
    },
    status: TRANSACTION_STATUS.TIMEDOUT,
  },
  {
    type: EVENT_TYPE.ENS_NAME_REGISTERED,
    id: 'ensName-1',
    date: new Date('2021-04-10'),
    ensName: 'maciej.pillar.eth',
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    fee: {
      value: BigNumber(0.0022311),
      symbol: 'ETH',
      address: mockEthAddress,
    },
  },
  {
    type: EVENT_TYPE.WALLET_ACTIVATED,
    id: '5ca21c49754407000644f73b-x',
    date: new Date('2021-04-10'),
    hash: '0xd32eecbf27c962251dc505ae1b23906cb9cad5daf6e9973ec390fc206a6d15f0',
    fee: {
      value: BigNumber(0.0222311),
      symbol: 'ETH',
      address: mockEthAddress,
    },
    status: TRANSACTION_STATUS.CONFIRMED,
  },
  {
    type: EVENT_TYPE.WALLET_CREATED,
    id: '5ca21c49754407000644f73b',
    date: new Date('2021-04-10'),
  },
];
