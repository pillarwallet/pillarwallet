// @flow
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
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
