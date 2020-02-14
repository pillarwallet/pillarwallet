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
import 'ethers/dist/shims.js';
import { self } from 'react-native-threads';
import { utils } from 'ethers';

const { HDNode } = utils;

// listen for messages
self.onmessage = (message) => {
  // send a message, strings only
  const kpArgs = JSON.parse(message);
  const keyPairs = [];
  let hdnodebase;
  if (kpArgs.mnemonic && kpArgs.mnemonic.length > 0) {
    hdnodebase = HDNode.fromMnemonic(kpArgs.mnemonic);
  } else {
    hdnodebase = HDNode.fromSeed(kpArgs.privateKey);
  }
  for (let i = 1; i <= kpArgs.count; i++) {
    const newIndex = kpArgs.lastCount + i;
    const A = hdnodebase.derivePath(`m/44/60'/0'/0/${newIndex}`);
    const Ad = hdnodebase.derivePath(`m/44/60'/0'/1/${newIndex}`);
    keyPairs.push({ A: A.publicKey, Ad: Ad.publicKey, connIndex: newIndex });
  }
  self.postMessage(JSON.stringify(keyPairs));
};
