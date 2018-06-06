/**
 * 
 * Performance monitoring representation wrapper
 */
import Trace from './Trace';
import ModuleBase from '../../utils/ModuleBase';
import { getNativeModule } from '../../utils/native';

export const MODULE_NAME = 'RNFirebasePerformance';
export const NAMESPACE = 'perf';

export default class PerformanceMonitoring extends ModuleBase {
  constructor(app) {
    super(app, {
      moduleName: MODULE_NAME,
      multiApp: false,
      hasShards: false,
      namespace: NAMESPACE
    });
  }

  /**
   * Globally enable or disable performance monitoring
   * @param enabled
   * @returns {*}
   */
  setPerformanceCollectionEnabled(enabled) {
    getNativeModule(this).setPerformanceCollectionEnabled(enabled);
  }

  /**
   * Returns a new trace instance
   * @param trace
   */
  newTrace(trace) {
    return new Trace(this, trace);
  }
}

export const statics = {};