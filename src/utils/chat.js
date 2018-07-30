// @flow
const { utils } = require('ethers');

export function generateChatPassword(privateKey: string): string {
  const strToHash = privateKey.slice(4, 10);
  // NOTE: utils.id() computes the keccak256 cryptographic hash of a UTF-8 string, returns as a hex string.
  return utils.id(strToHash).slice(-10);
}
