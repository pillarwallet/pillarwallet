// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2019 Stiftung Pillar Project

    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 2 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License along
    with this program; if not, write to the Free Software Foundation, Inc.,
    51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA.
*/
import { STAGING } from 'constants/envConstants';
import type { RariPool } from 'models/RariPool';

// Simplified envConfig mock with minimal dependencies for tests
// the following vars are CI/BUILD/DEVELOPER related
const buildEnvironment = {
  SENTRY_DSN: '',
  BUILD_NUMBER: '',
  BUILD_TYPE: STAGING,
  OPEN_SEA_API_KEY: '',
  INFURA_PROJECT_ID: '',
  RAMPNETWORK_API_KEY: '',
};

const devOptions = {
  SHOW_THEME_TOGGLE: undefined,
  SHOW_ONLY_STORYBOOK: undefined,
  SHOW_LANG_TOGGLE: undefined,
  DEFAULT_PIN: undefined,
};

const envVars = {
  staging: {
    TX_DETAILS_URL_ETHEREUM: 'https://kovan.etherscan.io/tx/',
    TX_DETAILS_URL_BINANCE: 'https://bscscan.com/tx/',
    TX_DETAILS_URL_POLYGON: 'https://polygonscan.com/tx/',
    TX_DETAILS_URL_XDAI: 'https://blockscout.com/xdai/mainnet/tx/',
    NETWORK_PROVIDER: 'kovan',
    COLLECTIBLES_NETWORK: 'rinkeby',
    OPEN_SEA_API: 'https://rinkeby-api.opensea.io/api/v1',
    ON_RAMPER_WIDGET_URL: 'https://ri-widget-staging-kovan.firebaseapp.com/',
    NEWSLETTER_SUBSCRIBE_URL:
      'https://pillarproject.us14.list-manage.com/subscribe/post-json?u=0056162978ccced9e0e2e2939&amp;id=637ab55cf8',
    SABLIER_CONTRACT_ADDRESS: '0xc04Ad234E01327b24a831e3718DBFcbE245904CC',
    SABLIER_SUBGRAPH_NAME: 'sablierhq/sablier-kovan',
    RARI_SUBGRAPH_NAME: 'graszka22/rari-transactions',
    MSTABLE_SUBGRAPH_NAME: 'mstable/mstable-protocol',
    MSTABLE_CONTRACT_ADDRESS: '0xe2f2a5C287993345a840Db3B0845fbC70f5935a5',
    ...buildEnvironment,
    ...devOptions,
  },
};

const rariPoolsEnv = {
  staging: {
    STABLE_POOL: {
      RARI_FUND_MANAGER_CONTRACT_ADDRESS: '0xC6BF8C8A55f77686720E0a88e2Fd1fEEF58ddf4a',
      RARI_FUND_PROXY_CONTRACT_ADDRESS: '0xD4be7E211680e12c08bbE9054F0dA0D646c45228',
      RARI_FUND_TOKEN_ADDRESS: '0x016bf078ABcaCB987f0589a6d3BEAdD4316922B0',
    },
    YIELD_POOL: {
      RARI_FUND_MANAGER_CONTRACT_ADDRESS: '0x59FA438cD0731EBF5F4cDCaf72D4960EFd13FCe6',
      RARI_FUND_PROXY_CONTRACT_ADDRESS: '0x6dd8e1Df9F366e6494c2601e515813e0f9219A88',
      RARI_FUND_TOKEN_ADDRESS: '0x3baa6B7Af0D72006d3ea770ca29100Eb848559ae',
    },
    ETH_POOL: {
      RARI_FUND_MANAGER_CONTRACT_ADDRESS: '0xD6e194aF3d9674b62D1b30Ec676030C23961275e',
      RARI_FUND_PROXY_CONTRACT_ADDRESS: '0xa3cc9e4B9784c80a05B3Af215C32ff223C3ebE5c',
      RARI_FUND_TOKEN_ADDRESS: '0xCda4770d65B4211364Cb870aD6bE19E7Ef1D65f4',
      RARI_FUND_CONTROLLER_CONTRACT_ADDRESS: '0xD9F223A36C2e398B0886F945a7e556B41EF91A3C',
    },
  },
};

const storedEnv = STAGING;

const setupEnv = () => ({});

const switchEnvironments = () => ({});

const getEnv = () => envVars[storedEnv];

const getRariPoolsEnv = (rariPool: RariPool) => rariPoolsEnv[storedEnv][rariPool];

export default {
  getEnv,
  setupEnv,
  switchEnvironments,
  getRariPoolsEnv,
};
