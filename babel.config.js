// @flow
module.exports = {
  presets: ['module:metro-react-native-babel-preset', '@babel/preset-env', '@babel/preset-react'],
  plugins: [
    ['module-resolver', { root: ['./src'] }],
    ['babel-plugin-styled-components'],
    '@babel/plugin-transform-flow-strip-types',
    '@babel/plugin-proposal-class-properties',
  ],
  env: {
    development: {
      plugins: ['babel-plugin-styled-components'],
    },
    production: {
      plugins: ['transform-remove-console'],
    },
  },
};
