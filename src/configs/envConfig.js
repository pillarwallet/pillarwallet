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
/* eslint-disable i18next/no-literal-string */

import { Alert } from 'react-native';
import Intercom from 'react-native-intercom';
import AsyncStorage from '@react-native-community/async-storage';
import Storage from 'services/storage';
import isEmpty from 'lodash.isempty';
import RNRestart from 'react-native-restart';
import { clearWebViewCookies } from 'utils/exchange';
import { reportErrorLog, reportLog } from 'utils/common';
import { firebaseIid } from 'services/firebase';
import { DEVELOPMENT, STAGING, PRODUCTION } from 'constants/envConstants';
import type { RariPool } from 'models/RariPool';

import { buildEnvironment, devOptions } from './buildConfig';

const storage = Storage.getInstance('db');

const buildType = __DEV__ ? DEVELOPMENT : PRODUCTION;

type CurrentEnvironment = {
  [string]: string
}

// switchable environments constants
const envVars = {
  production: {
    ENVIRONMENT: PRODUCTION,
    TX_DETAILS_URL: 'https://etherscan.io/tx/',
    NETWORK_PROVIDER: 'homestead',
    COLLECTIBLES_NETWORK: 'homestead',
    SDK_PROVIDER: 'https://api-core.pillarproject.io',
    NOTIFICATIONS_URL: 'https://api-notifications.pillarproject.io',
    INVESTMENTS_URL: 'https://api-investments.pillarproject.io',
    SYNTHETICS_URL: 'https://0p895xsjjc.execute-api.us-east-2.amazonaws.com/production',
    SYNTHETICS_CONTRACT_ADDRESS: '0xB64C48629eDFB9fA8860aa0AF802EA2e0F48017e',
    OPEN_SEA_API: 'https://api.opensea.io/api/v1',
    SOCKET_NOTIFICATIONS: 'wss://platform-websockets-prod.prod.pillarproject.io?walletId=',
    RAMPNETWORK_WIDGET_URL: 'https://buy.ramp.network/',
    RECOVERY_PORTAL_URL: 'https://recovery.pillarproject.io',
    NEWSLETTER_SUBSCRIBE_URL: 'https://pillarproject.us14.list-manage.com/subscribe/post-json?u=0056162978ccced9e0e2e2939&amp;id=637ab55cf8',
    AAVE_LENDING_POOL_ADDRESSES_PROVIDER_CONTRACT_ADDRESS: '0x24a42fD28C976A61Df5D00D0599C34c4f90748c8',
    AAVE_SUBGRAPH_NAME: 'aave/protocol-multy-raw',
    BALANCE_CHECK_CONTRACT: '0xb1F8e55c7f64D203C1400B9D8555d050F94aDF39',
    POOL_DAI_CONTRACT_ADDRESS: '0x29fe7D60DdF151E5b52e5FAB4f1325da6b2bD958',
    POOL_USDC_CONTRACT_ADDRESS: '0x0034Ea9808E620A0EF79261c51AF20614B742B24',
    DAI_ADDRESS: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    USDC_ADDRESS: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    POOLTOGETHER_SUBGRAPH_NAME: 'alazarevski/pool-together-transactions',
    SABLIER_CONTRACT_ADDRESS: '0xA4fc358455Febe425536fd1878bE67FfDBDEC59a',
    SABLIER_SUBGRAPH_NAME: 'sablierhq/sablier',
    SYNTHETIX_EXCHANGE_ADDRESS: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F',
    SYNTHETIX_RATES_ADDRESS: '0xda80E6024bC82C9fe9e4e6760a9769CF0D231E80',
    UNISWAP_CACHED_SUBGRAPH_ASSETS_URL: 'https://pillar-prod-token-cacher-files.s3.eu-west-2.amazonaws.com/uniswap.csv',
    WBTC_CURVE: '0x93054188d876f558f4a66B2EF1d97d16eDf0895B',
    WBTC_FROM_ADDRESS: '0x73ab2bd10ad10f7174a1ad5afae3ce3d991c5047',
    WBTC_FEES_API: 'https://lightnode-mainnet.herokuapp.com',
    ETHPLORER_API_URL: 'https://api.ethplorer.io',
    RARI_SUBGRAPH_NAME: 'graszka22/rari-transactions',
    MSTABLE_SUBGRAPH_NAME: 'mstable/mstable-protocol',
    MSTABLE_CONTRACT_ADDRESS: '0xe2f2a5C287993345a840Db3B0845fbC70f5935a5',
    MSTABLE_VALIDATION_HELPER_CONTRACT_ADDRESS: '0xabcc93c3be238884cc3309c19afd128fafc16911',
    RARI_GOVERNANCE_TOKEN_CONTRACT_ADDRESS: '0xD291E7a03283640FDc51b121aC401383A46cC623',
    RARI_RGT_DISTRIBUTOR_CONTRACT_ADDRESS: '0x9C0CaEb986c003417D21A7Daaf30221d61FC1043',
    UNIPOOL_CONTRACT_ADDRESS: '0x32105017918Cb9CD9A5f21fd6984Ee7DC82B9E7E',
    UNISWAP_SUBGRAPH_NAME: 'uniswap/uniswap-v2',
    ...buildEnvironment,
    ...devOptions,
  },
  staging: {
    ENVIRONMENT: STAGING,
    TX_DETAILS_URL: 'https://kovan.etherscan.io/tx/',
    NETWORK_PROVIDER: 'kovan',
    COLLECTIBLES_NETWORK: 'rinkeby',
    SDK_PROVIDER: 'https://api-qa-core.pillarproject.io',
    NOTIFICATIONS_URL: 'https://api-qa-notifications.pillarproject.io',
    INVESTMENTS_URL: 'https://api-qa-investments.pillarproject.io',
    SYNTHETICS_URL: 'https://10lskb6zud.execute-api.us-east-2.amazonaws.com/qa',
    SYNTHETICS_CONTRACT_ADDRESS: '0x47230564236C772Eaf98F82d9e5A1fAD2380aDf9',
    OPEN_SEA_API: 'https://rinkeby-api.opensea.io/api/v1',
    SOCKET_NOTIFICATIONS: 'wss://platform-websockets-qa.nonprod.pillarproject.io?walletId=',
    RAMPNETWORK_WIDGET_URL: 'https://ri-widget-staging-kovan.firebaseapp.com/',
    RECOVERY_PORTAL_URL: 'https://recovery-qa.pillarproject.io',
    NEWSLETTER_SUBSCRIBE_URL: 'https://pillarproject.us14.list-manage.com/subscribe/post-json?u=0056162978ccced9e0e2e2939&amp;id=637ab55cf8',
    AAVE_LENDING_POOL_ADDRESSES_PROVIDER_CONTRACT_ADDRESS: '0x506B0B2CF20FAA8f38a4E2B524EE43e1f4458Cc5',
    AAVE_SUBGRAPH_NAME: 'aave/protocol-multy-kovan-raw',
    BALANCE_CHECK_CONTRACT: '0x0139F2902635be265C23DeffAd2Edac5B7CCACE7',
    POOL_DAI_CONTRACT_ADDRESS: '0xC3a62C8Af55c59642071bC171Ebd05Eb2479B663',
    POOL_USDC_CONTRACT_ADDRESS: '0xa0B2A98d0B769886ec06562ee9bB3572Fa4f3aAb',
    DAI_ADDRESS: '0x4F96Fe3b7A6Cf9725f59d353F723c1bDb64CA6Aa',
    USDC_ADDRESS: '0x75B0622Cec14130172EaE9Cf166B92E5C112FaFF',
    POOLTOGETHER_SUBGRAPH_NAME: 'alazarevski/pool-together-transactions-kovan',
    SABLIER_CONTRACT_ADDRESS: '0xc04Ad234E01327b24a831e3718DBFcbE245904CC',
    SABLIER_SUBGRAPH_NAME: 'sablierhq/sablier-kovan',
    SYNTHETIX_EXCHANGE_ADDRESS: '0xC011a73ee8576Fb46F5E1c5751cA3B9Fe0af2a6F',
    SYNTHETIX_RATES_ADDRESS: '0xA36f5A656c48EB0b43b63293E690DA746162d40B',
    UNISWAP_CACHED_SUBGRAPH_ASSETS_URL: 'https://pillar-qa-token-cacher-files.s3.eu-west-2.amazonaws.com/uniswap.csv',
    WBTC_CURVE: '0x62869F49ea8b6c3EEdEcA8b8b1c6731090aD7A3D',
    WBTC_FROM_ADDRESS: '0xF85999731C696d1C86558b057101b69889b41Fe8',
    WBTC_FEES_API: 'https://lightnode-mainnet.herokuapp.com',
    ETHPLORER_API_URL: 'https://kovan-api.ethplorer.io',
    RARI_SUBGRAPH_NAME: 'graszka22/rari-transactions',
    MSTABLE_SUBGRAPH_NAME: 'mstable/mstable-protocol',
    MSTABLE_CONTRACT_ADDRESS: '0xe2f2a5C287993345a840Db3B0845fbC70f5935a5',
    MSTABLE_VALIDATION_HELPER_CONTRACT_ADDRESS: '0xabcc93c3be238884cc3309c19afd128fafc16911',
    RARI_GOVERNANCE_TOKEN_CONTRACT_ADDRESS: '0xD291E7a03283640FDc51b121aC401383A46cC623',
    RARI_RGT_DISTRIBUTOR_CONTRACT_ADDRESS: '0x9C0CaEb986c003417D21A7Daaf30221d61FC1043',
    UNIPOOL_CONTRACT_ADDRESS: '0xFfD8C07309d3A3ce473Feb1d98ebF1F3171A83d9',
    UNISWAP_SUBGRAPH_NAME: 'graszka22/uniswapv2-kovan',
    ...buildEnvironment,
    ...devOptions,
  },
};

const rariPoolsEnv = {
  staging: {
    STABLE_POOL: {
      RARI_FUND_MANAGER_CONTRACT_ADDRESS: '0xC6BF8C8A55f77686720E0a88e2Fd1fEEF58ddf4a',
      RARI_FUND_PROXY_CONTRACT_ADDRESS: '0xe4deE94233dd4d7c2504744eE6d34f3875b3B439',
      RARI_FUND_TOKEN_ADDRESS: '0x016bf078ABcaCB987f0589a6d3BEAdD4316922B0',
    },
    YIELD_POOL: {
      RARI_FUND_MANAGER_CONTRACT_ADDRESS: '0x59FA438cD0731EBF5F4cDCaf72D4960EFd13FCe6',
      RARI_FUND_PROXY_CONTRACT_ADDRESS: '0x35DDEFa2a30474E64314aAA7370abE14c042C6e8',
      RARI_FUND_TOKEN_ADDRESS: '0x3baa6B7Af0D72006d3ea770ca29100Eb848559ae',
    },
    ETH_POOL: {
      RARI_FUND_MANAGER_CONTRACT_ADDRESS: '0xD6e194aF3d9674b62D1b30Ec676030C23961275e',
      RARI_FUND_PROXY_CONTRACT_ADDRESS: '0xa3cc9e4B9784c80a05B3Af215C32ff223C3ebE5c',
      RARI_FUND_TOKEN_ADDRESS: '0xCda4770d65B4211364Cb870aD6bE19E7Ef1D65f4',
      RARI_FUND_CONTROLLER_CONTRACT_ADDRESS: '0xD9F223A36C2e398B0886F945a7e556B41EF91A3C',
    },
  },
  production: {
    STABLE_POOL: {
      RARI_FUND_MANAGER_CONTRACT_ADDRESS: '0xC6BF8C8A55f77686720E0a88e2Fd1fEEF58ddf4a',
      RARI_FUND_PROXY_CONTRACT_ADDRESS: '0xe4deE94233dd4d7c2504744eE6d34f3875b3B439',
      RARI_FUND_TOKEN_ADDRESS: '0x016bf078ABcaCB987f0589a6d3BEAdD4316922B0',
    },
    YIELD_POOL: {
      RARI_FUND_MANAGER_CONTRACT_ADDRESS: '0x59FA438cD0731EBF5F4cDCaf72D4960EFd13FCe6',
      RARI_FUND_PROXY_CONTRACT_ADDRESS: '0x35DDEFa2a30474E64314aAA7370abE14c042C6e8',
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

// default environment before switching
let storedEnv = buildType === PRODUCTION ? PRODUCTION : STAGING;

// sets up the current stored environment on App load
export const setupEnv = () => {
  return storage.get('environment').then(res => {
    if (!isEmpty(res)) {
      storedEnv = res;
    } else {
      storage.save('environment', storedEnv, true);
    }
    return storedEnv;
  })
    .catch(() => {
      reportErrorLog('Error getting environment storage value', { buildType });
      return null;
    });
};

export const switchEnvironments = () => {
  Alert.alert(
    'Warning: Environment Switch !',
    'Switching environments will DELETE THE WALLET STORAGE,' +
    '\nmake sure to have the BACKUP available BEFORE clicking OK!!!',
    [
      {
        text: 'Cancel',
        onPress: () => null,
        style: 'cancel',
      },
      {
        text: 'OK',
        onPress: async () => {
          const newEnv = storedEnv === PRODUCTION ? STAGING : PRODUCTION;
          await AsyncStorage.clear(); // removes storage and redux persist data
          await Intercom.logout();
          await firebaseIid.delete()
            .catch(e => reportLog(`Could not delete the Firebase ID when resetting app state: ${e.message}`, e));
          clearWebViewCookies();
          await storage.save('environment', newEnv, true).then(async () => {
            storedEnv = newEnv;
            RNRestart.Restart();
          });
        },
      },
    ],
    { cancelable: true },
  );
};

// current environment accessor function
// $FlowFixMe: flow update to 0.122
export const getEnv = (): CurrentEnvironment => envVars[storedEnv];

export const getRariPoolsEnv = (rariPool: RariPool): CurrentEnvironment => rariPoolsEnv[storedEnv][rariPool];
