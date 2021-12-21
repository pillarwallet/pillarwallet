import type { Config } from '@jest/types';
// Sync object
const config: Config.InitialOptions = {
  verbose: true,
  transform: {
    '^.+\\.js?$': 'jest',
    '^.+\\.ts?$': 'ts-jest',
  },
  globals: {
    __DEV__: true,
  },
};
export default config;
