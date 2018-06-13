

const providerId = 'facebook.com'; /**
                                    * 
                                    * FacebookAuthProvider representation wrapper
                                    */


export default class FacebookAuthProvider {
  constructor() {
    throw new Error('`new FacebookAuthProvider()` is not supported on the native Firebase SDKs.');
  }

  static get PROVIDER_ID() {
    return providerId;
  }

  static credential(token) {
    return {
      token,
      secret: '',
      providerId
    };
  }
}