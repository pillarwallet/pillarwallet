import type { Config } from '@jest/types';

// Sync object
const config: Config.InitialOptions = {
  preset: 'react-native',
  modulePaths: ['<rootDir>/src/'],
  testRegex: '\\.test\\.js$',
  testResultsProcessor: './node_modules/jest-html-reporter',
  collectCoverageFrom: ['**/*.{js,jsx}', '!**/node_modules/**', '!**/reports/**'],
  coverageReporters: ['lcov'],
  coverageDirectory: './reports',
  setupFilesAfterEnv: ['./src/testUtils/jestSetup.js', '@testing-library/react'],
  setupFiles: ['./node_modules/react-native-gesture-handler/jestSetup.js', 'core-js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-[a-z, -]*|react-native-[a-z, -]*|@react-native|react-native|pouchdb-react-native|@react-navigation|pouchdb-adapter-asyncstorage|tcomb-form-native|concat-color-matrices|rn-color-matrices|@react-native-firebase|@expo/react-native-action-sheet|@react-native-community/datetimepicker|@codler/react-native-keyboard-aware-scroll-view|@react-native-picker|@hookform|victory-.*|@rari-capital/rari-sdk)/)',
  ],
  moduleNameMapper: {
    '\\.(jpg|ico|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$':
      '<rootDir>/__mocks__/fileMock.js',
    '\\.(css|less)$': '<rootDir>/mocks/fileMock.js',
    '@ethersproject/shims': '<rootDir>/node_modules/@ethersproject/shims/dist',
    'styled-components': 'styled-components/native',
  },
  verbose: true,
  transform: {
    '^.+\\.js?$': 'babel-jest',
    '^.+\\.ts?$': 'ts-jest',
  },
  globals: {
    __DEV__: true,
  },
};
export default config;
