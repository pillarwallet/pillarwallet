import { NativeModules } from 'react-native'

const { RNScrypt } = NativeModules

export default async function scrypt (passwd, salt, N=16384, r=8, p=1, dkLen=64) {
  return RNScrypt.scrypt(passwd, salt, N, r, p, dkLen)
}
