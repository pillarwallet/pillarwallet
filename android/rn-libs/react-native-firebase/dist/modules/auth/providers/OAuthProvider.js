

const providerId = 'oauth'; /**
                             * 
                             * OAuthProvider representation wrapper
                             */


export default class OAuthProvider {
  constructor() {
    throw new Error('`new OAuthProvider()` is not supported on the native Firebase SDKs.');
  }

  static get PROVIDER_ID() {
    return providerId;
  }

  static credential(idToken, accessToken) {
    return {
      token: idToken,
      secret: accessToken,
      providerId
    };
  }
}