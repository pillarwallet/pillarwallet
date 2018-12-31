// @flow
const binaryToBase64 = require('react-native/Libraries/Utilities/binaryToBase64');
const base64 = require('base64-js');
const { utils } = require('ethers');

export function generateChatPassword(privateKey: string): string {
  const strToHash = privateKey.slice(4, 10);
  // NOTE: utils.id() computes the keccak256 cryptographic hash of a UTF-8 string, returns as a hex string.
  return utils.id(strToHash).slice(-10);
}

export function prepareWebSocketRequest(encodedRequest: string): ArrayBuffer {
  return base64.toByteArray(encodedRequest);
}

export function parseWebSocketResponse(response: Object): string {
  const data = new Uint8Array(response.data);
  return binaryToBase64(data.buffer);
}
