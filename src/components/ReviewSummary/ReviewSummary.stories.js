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
import CenterView from '../../../storybook/CenterView';

import ReviewSummary from './ReviewSummary';

const plrAsset = {
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
};

const collectible = {
  id: '5191',
  category: 'CryptoKittiesRinkeby',
  name: 'CryptoKittiesRinkeby 5191',
  contractAddress: '0x16baf0de678e52367adc69fd067e5edd1d33e3bf',
  assetContract: 'CryptoKittiesRinkeby',
  tokenType: 'COLLECTIBLES',
  image: 'https://lh3.googleusercontent.com/_xZzagx4SF8SL0y959uaWtk_qHwo5Q0ztJrsLYMaxOTr991UrisNXo4MS0Ny7EV9hgcCEL7MNQbz29_ji5Z-XEnk',
  icon: 'https://lh3.googleusercontent.com/_xZzagx4SF8SL0y959uaWtk_qHwo5Q0ztJrsLYMaxOTr991UrisNXo4MS0Ny7EV9hgcCEL7MNQbz29_ji5Z-XEnk=s250',
};

storiesOf('ReviewSummary', module)
  .add('token', () => (
    <CenterView>
      <ReviewSummary asset={plrAsset} text="You are sending" amount={102.1} />
    </CenterView>
  ))
  .add('collectible', () => (
    <CenterView>
      <ReviewSummary collectible={collectible} text="You are sending" />
    </CenterView>
  ));
