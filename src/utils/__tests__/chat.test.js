// @flow
import { generateChatPassword } from '../chat';

describe('Chat utils', () => {
  describe('generateChatPassword', () => {
    it('should generate the chat password using keccak256 cryptographic hash from the string provided', () => {
      const privateKey = '0x067D674A5D8D0DEBC0B02D4E5DB5166B3FA08384DCE50A574A0D0E370B4534F9';
      const expectedPassword = '6de7cf53aa';
      expect(generateChatPassword(privateKey)).toBe(expectedPassword);
    });
  });
});
