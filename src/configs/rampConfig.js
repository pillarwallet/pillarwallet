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

import { ETH, DAI, USDC, USDT, MATIC, XDAI, ETHEREUM, POLYGON, ARBITRUM, GNOSIS, BSC } from 'constants/assetsConstants';

export const MATIC_DAI = 'MATIC_DAI';
export const MATIC_USDC = 'MATIC_USDC';
export const BSC_BNB = 'BSC_BNB';
export const ARBITRUM_ETH = 'ARBITRUM_ETH';
export const OPTIMISM_DAI = 'OPTIMISM_DAI';
export const OPTIMISM_ETH = 'OPTIMISM_ETH';

export const ETHERSPOT_RAMP_CURRENCY_TOKENS = [
  ETH,
  DAI,
  USDC,
  USDT,
  MATIC,
  MATIC_DAI,
  MATIC_USDC,
  XDAI,
  BSC_BNB,
  ARBITRUM_ETH,
  OPTIMISM_DAI,
  OPTIMISM_ETH,
];

export const ARCHANOVA_RAMP_CURRENCY_TOKENS = ETH;

export const ONRAMPERSUPPORTEDCHAINS = [ETHEREUM, POLYGON, ARBITRUM, GNOSIS, BSC];
