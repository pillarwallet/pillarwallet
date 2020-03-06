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
import { Platform } from 'react-native';
import { utils } from 'ethers';
import { Thread } from 'react-native-threads';
import { PRE_KEY_THRESHOLD } from 'configs/connectionKeysConfig';

const { HDNode } = utils;

export function generateHDKeyPair(hdnodebase: HDNode, derivePath: string, connIndex: number): any {
  const dP1 = derivePath.replace('connType', '0');
  const dP2 = derivePath.replace('connType', '1');
  try {
    const hdnode1 = hdnodebase.derivePath(dP1);
    const hdnode2 = hdnodebase.derivePath(dP2);
    return {
      A: hdnode1.publicKey,
      Ad: hdnode2.publicKey,
      connIndex,
    };
  } catch (e) {
    throw e;
  }
}

export function generateKeyPairPool(
  mnemonic: ?string, privateKey: ?string,
  lastConnectionKeyIndex: number,
  connectionsCount: number = 0,
  count?: number = 50): Array<any> {
  const keyPairs = [];
  let hdnodebase;
  if (mnemonic && mnemonic.length > 0) {
    hdnodebase = HDNode.fromMnemonic(mnemonic);
  } else {
    hdnodebase = HDNode.fromSeed(privateKey);
  }
  for (let i = 1; i <= count + connectionsCount; i++) {
    const connIndex = i + lastConnectionKeyIndex;
    const derivePathBase = `m/44/60'/0'/connType/${connIndex}`;
    const jobTask = () => {
      return new Promise(async (resolve) => {
        resolve(generateHDKeyPair(hdnodebase, derivePathBase, connIndex));
      });
    };
    keyPairs.push(jobTask);
  }
  return keyPairs;
}

const threadJobWorkerSeed = (
  mnemonic,
  privateKey,
  derivePathBase,
  threadIndex,
  connectionsCount,
  thread,
  lastConnectionKeyIndex,
  threadCount,
) => {
  return () => {
    return new Promise((resolve, reject) => {
      let count = 5;
      let lastCount = lastConnectionKeyIndex + (threadIndex * count);
      if (lastConnectionKeyIndex < 0) {
        count = Math.ceil(((threadCount * count) + connectionsCount) / threadCount);
        lastCount = threadIndex * count;
      }
      try {
        const params = {
          lastCount,
          count,
          derivePathBase,
          mnemonic,
          privateKey,
        };

        thread.postMessage(JSON.stringify(params));

        thread.onmessage = (message) => {
          let parsedMessage = {};
          try {
            parsedMessage = JSON.parse(message);
          } catch (e) {
            //
          }
          resolve(parsedMessage);
          thread.terminate();
        };
      } catch (e) {
        reject(e);
      }
    });
  };
};

async function threadPoolCreation(threadCount: number = 5) {
  const threads = [];
  for (let i = 0; i < threadCount; i++) {
    threads.push(new Thread('index.thread.js'));
  }
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(threads);
    }, 1000);
  });
}

export async function generateKeyPairThreadPool(
  mnemonic: ?string,
  privateKey: ?string,
  connectionsCount: number = 0,
  connectionsKeyPairCount: number = 0,
  lastConnectionKeyIndex: number = -1): Promise<Array<any>> {
  const derivePathBase = 'm/44/60\'/0\'/0/0';
  let promiseJobs = [];
  if (connectionsKeyPairCount <= PRE_KEY_THRESHOLD) {
    const isDebuggingEnabled = typeof location !== 'undefined' // eslint-disable-line no-restricted-globals
      && location.href.toLowerCase().includes('debug'); // eslint-disable-line no-restricted-globals,no-undef
    if (isDebuggingEnabled && __DEV__) {
      promiseJobs = generateKeyPairPool(mnemonic, privateKey, lastConnectionKeyIndex, connectionsCount, 25);
    } else {
      const threads = await threadPoolCreation(5);
      for (let i = 0; i < threads.length; i++) {
        const job = threadJobWorkerSeed(
          mnemonic,
          privateKey,
          derivePathBase,
          i,
          connectionsCount,
          threads[i],
          lastConnectionKeyIndex,
          threads.length,
        );
        promiseJobs.push(job);
      }
    }
  }
  const threadPairs = await Promise.all(promiseJobs.map(task => task()));
  const allPairsResults = [].concat(...threadPairs);
  return allPairsResults.sort((a, b) => { return a.connIndex < b.connIndex ? -1 : 1; });
}
