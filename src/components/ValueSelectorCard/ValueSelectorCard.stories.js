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
import { storiesOf } from '@storybook/react-native';
import { PLR, GBP } from 'constants/assetsConstants';

import { ValueSelectorCard as ValueSelectorCardElement } from 'components/ValueSelectorCard';

const reduxMock = {
  assets: [
    {
      isPreferred: false,
      address: '0x0000000000000000000000000000000000000000',
      decimals: 18,
      description: 'Ethereum is a decentralized platform that runs smart contracts: applications that run exactly' +
        'asprogrammed without any possibility of downtime, censorship, fraud or third-party interference.',
      name: 'Ethereum',
      symbol: 'ETH',
      value: 'ETH',
      wallpaperUrl: 'asset/images/tokens/wallpaper/ethBg.png',
      iconUrl: 'asset/images/tokens/icons/ethColor.png',
      iconMonoUrl: 'asset/images/tokens/icons/eth.png',
      email: '',
      telegram: '',
      twitter: 'https://twitter.com/ethereum',
      website: 'https://ethereum.org/',
      whitepaper: '',
      isDefault: true,
      patternUrl: 'asset/images/patternIcons/eth.png',
      updatedAt: '2019-08-30T10:20:13.866Z',
      socialMedia: [],
      icos: [],
      id: '5c65a07d000204d2f9481c1c',
    },
    {
      isPreferred: false,
      address: '0x0C16e81FB5E5215DB5dd5e8ECa7Bb9975fFa0F75',
      decimals: 18,
      description: 'Pillar is developing a decentralised solution for digital asset and personal data management.',
      name: 'Pillar',
      symbol: 'PLR',
      value: 'PLR',
      wallpaperUrl: 'asset/images/tokens/wallpaper/plrBg.png',
      iconUrl: 'asset/images/tokens/icons/plrColor.png',
      iconMonoUrl: 'asset/images/tokens/icons/plr.png',
      email: 'info@pillarproject.io',
      telegram: 'https://t.me/pillarofficial',
      twitter: 'https://twitter.com/PillarWallet',
      website: 'https://pillarproject.io/',
      whitepaper: 'https://pillarproject.io/documents/Pillar-Gray-Paper.pdf',
      isDefault: true,
      patternUrl: 'asset/images/patternIcons/plr.png',
      updatedAt: '2019-07-19T12:43:23.540Z',
      id: '5c65a07d000204d2f9481c1d',
      totalSupply: '',
      socialMedia: [],
      icos: [],
    },
  ],
  syntheticAssets: [],
  balances: {
    ETH: {
      balance: '0.512345',
      symbol: 'ETH',
    },
    PLR: {
      balance: '54321',
      symbol: 'ETH',
    },
  },
  rates: {
    ETH: {
      ETH: 1,
      EUR: 206,
      GBP: 185,
      UDS: 230,
    },
    PLR: {
      ETH: 0.008,
      EUR: 0.25,
      GBP: 0.1,
      UDS: 0.3,
    },
  },
  baseFiatCurrency: GBP,
};

storiesOf('Value Selector Card', module)
  .add('Selector without preselected asset', () => (
    <ValueSelectorCardElement {...reduxMock} getFormValue={() => {}} />
  ))
  .add('Selector with preselected asset', () => (
    <ValueSelectorCardElement {...reduxMock} getFormValue={() => {}} preselectedAsset={PLR} />
  ))
  .add('Selector with custom max label', () => (
    <ValueSelectorCardElement {...reduxMock} getFormValue={() => {}} maxLabel="Use Max" />
  ));
