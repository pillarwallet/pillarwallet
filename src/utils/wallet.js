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
import { getRandomInt } from 'utils/common';
import DeviceInfo from 'react-native-device-info';
import ethers from 'ethers';

export function generateMnemonicPhrase(mnemonicPhrase?: string) {
  return mnemonicPhrase || ethers.HDNode.entropyToMnemonic(ethers.utils.randomBytes(16));
}

export function generateWordsToValidate(numWordsToGenerate: number, maxWords: number) {
  const chosenWords = [];
  while (chosenWords.length < numWordsToGenerate) {
    const randomNumber = getRandomInt(1, maxWords);
    if (chosenWords.includes(randomNumber)) continue; // eslint-disable-line
    chosenWords.push(randomNumber);
  }
  chosenWords.sort((a, b) => a - b);
  return chosenWords;
}


export function getSaltedPin(pin: string): string {
  const uniqueId = DeviceInfo.getUniqueID();
  return uniqueId + pin + uniqueId.slice(0, 5);
}
