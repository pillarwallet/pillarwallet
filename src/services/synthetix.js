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

/* eslint-disable i18next/no-literal-string */

import synthetix, { getTokens, getSynths } from 'synthetix';
import ethers from 'ethers';

import { getEnv } from 'configs/envConfig';

// utils
import { getEthereumProvider } from 'utils/common';
import { isProdEnv } from 'utils/environment';

const ethProvider = getEthereumProvider(getEnv().NETWORK_PROVIDER);
const network = isProdEnv ? 'mainnet' : 'kovan';
const { address } = synthetix.getTarget({ network, contract: 'ProxyERC20' });
const { abi } = synthetix.getSource({ network, contract: 'Synthetix' });

const getSnxjs = (privateKey: string) => {
  const signer = new ethers.Wallet(privateKey).connect(ethProvider);
  return new ethers.Contract(address, abi, signer);
};

export const fetchSynthetixSupportedAssets = () => getTokens({ network }).map(token => token.symbol);

function Synthetix() {
  this.snxjs = null;
}

Synthetix.prototype.exchange = async () => {
  //
};

Synthetix.prototype.init = (privateKey: string) => {
  this.snxjs = getSnxjs(privateKey);
};

export default Synthetix;
