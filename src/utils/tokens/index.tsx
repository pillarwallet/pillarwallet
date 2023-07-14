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

// Utils
import { nativeAssetPerChain } from 'utils/chains';

// Assets
const aave = require('assets/tokens/aave.png');
const ada = require('assets/tokens/ADA-9F4.png');
const apecoin = require('assets/tokens/apecoin.png');
const atom = require('assets/tokens/ATOM-596.png');
const avax = require('assets/tokens/avax.png');
const axs = require('assets/tokens/axs.png');
const bitcoin = require('assets/tokens/bitcoin.png');
const bob = require('assets/tokens/bob.png');
const busd = require('assets/tokens/busd.png');
const chainlink = require('assets/tokens/chainlink.png');
const crv = require('assets/tokens/crv.png');
const dai = require('assets/tokens/dai.png');
const doge = require('assets/tokens/doge.png');
const dot = require('assets/tokens/DOT-64C.png');
const fil = require('assets/tokens/FIL-E2C.png');
const fxs = require('assets/tokens/fxs.png');
const gmx = require('assets/tokens/GMX.png');
const gno = require('assets/tokens/gno.png');
const lusd = require('assets/tokens/lusd.png');
const mana = require('assets/tokens/mana.png');
const op = require('assets/tokens/op.png');
const pillar = require('assets/tokens/pillar.png');
const sand = require('assets/tokens/sand.png');
const sol = require('assets/tokens/sol.jpeg');
const uniswap = require('assets/tokens/uniswap.png');
const usdc = require('assets/tokens/USDC-CD2.png');
const usdt = require('assets/tokens/usdt.png');
const velo = require('assets/tokens/velo.png');
const xrp = require('assets/tokens/XRP-BF2.png');
const mai = require('assets/tokens/mai.png');

const defaultTokens = [
  { name: 'aave', path: aave },
  { name: 'ada', path: ada },
  { name: 'apecoin', path: apecoin },
  { name: 'atom', path: atom },
  { name: 'avax', path: avax },
  { name: 'axs', path: axs },
  { name: 'bitcoin', path: bitcoin },
  { name: 'bob', path: bob },
  { name: 'busd', path: busd },
  { name: 'chainlink', path: chainlink },
  { name: 'crv', path: crv },
  { name: 'dai', path: dai },
  { name: 'doge', path: doge },
  { name: 'dot', path: dot },
  { name: 'fil', path: fil },
  { name: 'fxs', path: fxs },
  { name: 'gmx', path: gmx },
  { name: 'gno', path: gno },
  { name: 'lusd', path: lusd },
  { name: 'mana', path: mana },
  { name: 'op', path: op },
  { name: 'pillar', path: pillar },
  { name: 'sand', path: sand },
  { name: 'sol', path: sol },
  { name: 'uniswap', path: uniswap },
  { name: 'usdc', path: usdc },
  { name: 'usdt', path: usdt },
  { name: 'velo', path: velo },
  { name: 'xrp', path: xrp },
  { name: 'mai', path: mai },
];

export const defaultTokensIcon = (name: string) => {
  if (!name) return null;

  const tokenIcon = defaultTokens.find((tokenInfo) => tokenInfo.name === name);

  if (!tokenIcon) {
    return null;
  }

  return tokenIcon.path;
};

export const isChainIcon = (nameOrUrl: string): boolean => {
  if (!nameOrUrl) return false;

  const chainInfo = nativeAssetPerChain[nameOrUrl];
  if (!chainInfo) return false;

  return true;
};
