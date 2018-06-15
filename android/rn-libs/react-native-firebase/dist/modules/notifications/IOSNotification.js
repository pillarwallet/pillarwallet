/**
 * 
 * IOSNotification representation wrapper
 */
export default class IOSNotification {
  // N/A | threadIdentifier

  // alertLaunchImage | launchImageName
  // N/A | attachments
  constructor(notification, data) {
    this._notification = notification;

    if (data) {
      this._alertAction = data.alertAction;
      this._attachments = data.attachments;
      this._badge = data.badge;
      this._category = data.category;
      this._hasAction = data.hasAction;
      this._launchImage = data.launchImage;
      this._threadIdentifier = data.threadIdentifier;
    }

    // Defaults
    this._attachments = this._attachments || [];
  } // hasAction | N/A
  // applicationIconBadgeNumber | badge
  // alertAction | N/A


  get alertAction() {
    return this._alertAction;
  }

  get attachments() {
    return this._attachments;
  }

  get badge() {
    return this._badge;
  }

  get category() {
    return this._category;
  }

  get hasAction() {
    return this._hasAction;
  }

  get launchImage() {
    return this._launchImage;
  }

  get threadIdentifier() {
    return this._threadIdentifier;
  }

  /**
   *
   * @param identifier
   * @param url
   * @param options
   * @returns {Notification}
   */
  addAttachment(identifier, url, options) {
    this._attachments.push({
      identifier,
      options,
      url
    });
    return this._notification;
  }

  /**
   *
   * @param alertAction
   * @returns {Notification}
   */
  setAlertAction(alertAction) {
    this._alertAction = alertAction;
    return this._notification;
  }

  /**
   *
   * @param badge
   * @returns {Notification}
   */
  setBadge(badge) {
    this._badge = badge;
    return this._notification;
  }

  /**
   *
   * @param category
   * @returns {Notification}
   */
  setCategory(category) {
    this._category = category;
    return this._notification;
  }

  /**
   *
   * @param hasAction
   * @returns {Notification}
   */
  setHasAction(hasAction) {
    this._hasAction = hasAction;
    return this._notification;
  }

  /**
   *
   * @param launchImage
   * @returns {Notification}
   */
  setLaunchImage(launchImage) {
    this._launchImage = launchImage;
    return this._notification;
  }

  /**
   *
   * @param threadIdentifier
   * @returns {Notification}
   */
  setThreadIdentifier(threadIdentifier) {
    this._threadIdentifier = threadIdentifier;
    return this._notification;
  }

  build() {
    // TODO: Validation of required fields

    return {
      alertAction: this._alertAction,
      attachments: this._attachments,
      badge: this._badge,
      category: this._category,
      hasAction: this._hasAction,
      launchImage: this._launchImage,
      threadIdentifier: this._threadIdentifier
    };
  }
}