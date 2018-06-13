

const providerId = 'google.com'; /**
                                  * 
                                  * EmailAuthProvider representation wrapper
                                  */


export default class GoogleAuthProvider {
  constructor() {
    throw new Error('`new GoogleAuthProvider()` is not supported on the native Firebase SDKs.');
  }

  static get PROVIDER_ID() {
    return providerId;
  }

  static credential(token, secret) {
    return {
      token,
      secret,
      providerId
    };
  }
}