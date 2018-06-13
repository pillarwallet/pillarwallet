import { initialiseLogger } from './log';
import { initialiseNativeModule } from './native';

export default class ModuleBase {

  /**
   *
   * @param app
   * @param config
   */
  constructor(app, config, serviceUrl) {
    if (!config.moduleName) {
      throw new Error('Missing module name');
    }
    if (!config.namespace) {
      throw new Error('Missing namespace');
    }
    const { moduleName } = config;
    this._app = app;
    this._serviceUrl = serviceUrl;
    this.namespace = config.namespace;

    // check if native module exists as all native
    initialiseNativeModule(this, config, serviceUrl);
    initialiseLogger(this, `${app.name}:${moduleName.replace('RNFirebase', '')}`);
  }

  /**
   * Returns the App instance for current module
   * @return {*}
   */
  get app() {
    return this._app;
  }
}