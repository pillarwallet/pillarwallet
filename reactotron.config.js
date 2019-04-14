// @flow
//
global.Reactotron = null;

/* eslint no-undef: 0, global-require: 0 */
export const ReactotronConfig = function ReactotronConfig() {
  const isTest = !!process.env['IS_TEST'];
  if (__DEV__ && !isTest) { // eslint-disable-line dot-notation
    const Reactotron = require('reactotron-react-native').default;

    const {
      trackGlobalErrors,
      openInEditor,
      overlay,
      networking,
    } = require('reactotron-react-native');

    const { reactotronRedux } = require('reactotron-redux');

    Reactotron.configure({
      name: 'PillarWallet',
      enabled: true,
    })
      .use(trackGlobalErrors())
      .use(openInEditor())
      .use(overlay())
      .use(reactotronRedux())
      .use(networking())
      .connect();

    Reactotron.clear();

    global.Reactotron = Reactotron;
  }
};
