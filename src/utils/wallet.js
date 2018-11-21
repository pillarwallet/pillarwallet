// @flow
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
