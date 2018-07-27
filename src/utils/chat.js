// @flow
const { utils } = require('ethers');

export function generateChatPassword(privateKey: string): string {
  const strToHash = privateKey.slice(4, 10);
  return utils.id(strToHash).slice(-10);
}
