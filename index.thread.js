// @flow
import { self } from 'react-native-threads';
import { HDNode } from 'ethers';

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
