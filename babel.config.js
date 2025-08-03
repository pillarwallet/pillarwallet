// @flow
// $FlowFixMe: api is untyped babel config param
module.exports = function (api) {
  const isESLint = api.caller((caller) => {
    return (caller && caller.name === '@babel/eslint-parser') || caller.name === 'ESLint';
  });

  api.cache(true);

  return {
    presets: [
      isESLint
        ? 'module:metro-react-native-babel-preset'
        : '@react-native/babel-preset',
    ],
    plugins: [['module-resolver', { root: ['./src'] }], ['babel-plugin-styled-components']],
    env: {
      development: {
        plugins: ['babel-plugin-styled-components'],
      },
      production: {
        plugins: ['transform-remove-console'],
      },
    },
  };
};
