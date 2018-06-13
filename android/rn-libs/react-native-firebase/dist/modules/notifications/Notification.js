/**
 * 
 * Notification representation wrapper
 */
import { Platform } from 'react-native';
import AndroidNotification from './AndroidNotification';
import IOSNotification from './IOSNotification';
import { generatePushID, isObject } from '../../utils';

export default class Notification {
  // alertTitle | title | contentTitle

  // soundName | sound | sound
  // alertBody | body | contentText

  // iOS 8/9 | 10+ | Android
  constructor(data) {
    this._android = new AndroidNotification(this, data && data.android);
    this._ios = new IOSNotification(this, data && data.ios);

    if (data) {
      this._body = data.body;
      this._data = data.data;
      this._notificationId = data.notificationId;
      this._sound = data.sound;
      this._subtitle = data.subtitle;
      this._title = data.title;
    }

    // Defaults
    this._data = this._data || {};
    // TODO: Is this the best way to generate an ID?
    this._notificationId = this._notificationId || generatePushID();
  } // N/A | subtitle | subText
  // userInfo | userInfo | extras


  get android() {
    return this._android;
  }

  get body() {
    return this._body;
  }

  get data() {
    return this._data;
  }

  get ios() {
    return this._ios;
  }

  get notificationId() {
    return this._notificationId;
  }

  get sound() {
    return this._sound;
  }

  get subtitle() {
    return this._subtitle;
  }

  get title() {
    return this._title;
  }

  /**
   *
   * @param body
   * @returns {Notification}
   */
  setBody(body) {
    this._body = body;
    return this;
  }

  /**
   *
   * @param data
   * @returns {Notification}
   */
  setData(data = {}) {
    if (!isObject(data)) {
      throw new Error(`Notification:withData expects an object but got type '${typeof data}'.`);
    }
    this._data = data;
    return this;
  }

  /**
   *
   * @param notificationId
   * @returns {Notification}
   */
  setNotificationId(notificationId) {
    this._notificationId = notificationId;
    return this;
  }

  /**
   *
   * @param sound
   * @returns {Notification}
   */
  setSound(sound) {
    this._sound = sound;
    return this;
  }

  /**
   *
   * @param subtitle
   * @returns {Notification}
   */
  setSubtitle(subtitle) {
    this._subtitle = subtitle;
    return this;
  }

  /**
   *
   * @param title
   * @returns {Notification}
   */
  setTitle(title) {
    this._title = title;
    return this;
  }

  build() {
    if (!this._notificationId) {
      throw new Error('Notification: Missing required `notificationId` property');
    }

    return {
      android: Platform.OS === 'android' ? this._android.build() : undefined,
      body: this._body,
      data: this._data,
      ios: Platform.OS === 'ios' ? this._ios.build() : undefined,
      notificationId: this._notificationId,
      sound: this._sound,
      subtitle: this._subtitle,
      title: this._title
    };
  }
}