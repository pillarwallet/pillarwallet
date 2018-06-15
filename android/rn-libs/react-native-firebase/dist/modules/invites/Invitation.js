/**
 * 
 * Invitation representation wrapper
 */
import { Platform } from 'react-native';
import AndroidInvitation from './AndroidInvitation';

export default class Invitation {

  constructor(title, message) {
    this._android = new AndroidInvitation(this);
    this._message = message;
    this._title = title;
  }

  get android() {
    return this._android;
  }

  /**
   *
   * @param androidClientId
   * @returns {Invitation}
   */
  setAndroidClientId(androidClientId) {
    this._androidClientId = androidClientId;
    return this;
  }

  /**
   *
   * @param androidMinimumVersionCode
   * @returns {Invitation}
   */
  setAndroidMinimumVersionCode(androidMinimumVersionCode) {
    this._androidMinimumVersionCode = androidMinimumVersionCode;
    return this;
  }

  /**
   *
   * @param callToActionText
   * @returns {Invitation}
   */
  setCallToActionText(callToActionText) {
    this._callToActionText = callToActionText;
    return this;
  }

  /**
   *
   * @param customImage
   * @returns {Invitation}
   */
  setCustomImage(customImage) {
    this._customImage = customImage;
    return this;
  }

  /**
   *
   * @param deepLink
   * @returns {Invitation}
   */
  setDeepLink(deepLink) {
    this._deepLink = deepLink;
    return this;
  }

  /**
   *
   * @param iosClientId
   * @returns {Invitation}
   */
  setIOSClientId(iosClientId) {
    this._iosClientId = iosClientId;
    return this;
  }

  build() {
    if (!this._message) {
      throw new Error('Invitation: Missing required `message` property');
    } else if (!this._title) {
      throw new Error('Invitation: Missing required `title` property');
    }

    return {
      android: Platform.OS === 'android' ? this._android.build() : undefined,
      androidClientId: this._androidClientId,
      androidMinimumVersionCode: this._androidMinimumVersionCode,
      callToActionText: this._callToActionText,
      customImage: this._customImage,
      deepLink: this._deepLink,
      iosClientId: this._iosClientId,
      message: this._message,
      title: this._title
    };
  }
}