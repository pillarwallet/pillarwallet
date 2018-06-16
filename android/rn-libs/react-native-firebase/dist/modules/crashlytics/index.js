/**
 * 
 * Crash Reporting representation wrapper
 */
import ModuleBase from '../../utils/ModuleBase';
import { getNativeModule } from '../../utils/native';

export const MODULE_NAME = 'RNFirebaseCrashlytics';
export const NAMESPACE = 'crashlytics';

export default class Crashlytics extends ModuleBase {
  constructor(app) {
    super(app, {
      moduleName: MODULE_NAME,
      multiApp: false,
      hasShards: false,
      namespace: NAMESPACE
    });
  }

  /**
   * Forces a crash. Useful for testing your application is set up correctly.
   */
  crash() {
    getNativeModule(this).crash();
  }

  /**
   * Logs a message that will appear in any subsequent crash reports.
   * @param {string} message
   */
  log(message) {
    getNativeModule(this).log(message);
  }

  /**
   * Logs a non fatal exception.
   * @param {string} code
   * @param {string} message
   */
  recordError(code, message) {
    getNativeModule(this).recordError(code, message);
  }

  /**
   * Set a boolean value to show alongside any subsequent crash reports.
   */
  setBoolValue(key, value) {
    getNativeModule(this).setBoolValue(key, value);
  }

  /**
   * Set a float value to show alongside any subsequent crash reports.
   */
  setFloatValue(key, value) {
    getNativeModule(this).setFloatValue(key, value);
  }

  /**
   * Set an integer value to show alongside any subsequent crash reports.
   */
  setIntValue(key, value) {
    getNativeModule(this).setIntValue(key, value);
  }

  /**
   * Set a string value to show alongside any subsequent crash reports.
   */
  setStringValue(key, value) {
    getNativeModule(this).setStringValue(key, value);
  }

  /**
   * Set the user ID to show alongside any subsequent crash reports.
   */
  setUserIdentifier(userId) {
    getNativeModule(this).setUserIdentifier(userId);
  }
}

export const statics = {};