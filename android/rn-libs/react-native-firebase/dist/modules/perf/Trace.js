/**
 * 
 * Trace representation wrapper
 */
import { getNativeModule } from '../../utils/native';


export default class Trace {

  constructor(perf, identifier) {
    this._perf = perf;
    this.identifier = identifier;
  }

  start() {
    getNativeModule(this._perf).start(this.identifier);
  }

  stop() {
    getNativeModule(this._perf).stop(this.identifier);
  }

  incrementCounter(event) {
    getNativeModule(this._perf).incrementCounter(this.identifier, event);
  }
}