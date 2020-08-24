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
import { Alert } from 'react-native';
import Intercom from 'react-native-intercom';
import AsyncStorage from '@react-native-community/async-storage';
import Storage from 'services/storage';
import isEmpty from 'lodash.isempty';
import RNRestart from 'react-native-restart';
import { clearWebViewCookies } from 'utils/exchange';
import { reportLog } from 'utils/common';
import { firebaseIid } from 'services/firebase';

const storage = Storage.getInstance('db');

const buildType = __DEV__ ? 'development' : 'production';

// the following vars are CI/BUILD/DEVELOPER related
const buildEnvironment = {
  SENTRY_DSN: 'https://3ea39df26dd24e479c27642d11566e43@sentry.io/1294444',
  BUILD_NUMBER: '_build_number_',
  BUILD_TYPE: buildType,
  OPEN_SEA_API_KEY: '_open_sea_api_key_',
  INFURA_PROJECT_ID: '_infura_project_id_',
  ETHPLORER_API_KEY: '_ethplorer_api_key_',
  RAMPNETWORK_API_KEY: '_rampnetwork_api_key_',
};

const devOptions = {
  SHOW_THEME_TOGGLE: null,
  SHOW_ONLY_STORYBOOK: null,
  SHOW_LANG_TOGGLE: null,
  DEFAULT_PIN: null,
};

const envVars = {
  production: {
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
    SENDWYRE_WIDGET_URL: 'https://pay.sendwyre.com/purchase',
    SENDWYRE_ACCOUNT_ID: 'AC_ERP9DMNTAMB',
    SENDWYRE_RETURN_URL: 'https://offers-webapp-prod.prod.pillarproject.io/sendwyre',
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
    ...buildEnvironment,
    ...devOptions,
  },
  staging: {
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
    SENDWYRE_WIDGET_URL: 'https://pay.sendwyre.com/purchase',
    SENDWYRE_ACCOUNT_ID: 'AC_ERP9DMNTAMB',
    SENDWYRE_RETURN_URL: 'https://ecs-offers-qa.nonprod.pillarproject.io/sendwyre',
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
    ...buildEnvironment,
    ...devOptions,
  },
};

let storedEnv = buildType === 'production' ? 'production' : 'staging';

export const setupEnv = () => {
  return storage.get('environment').then(res => {
    if (!isEmpty(res)) {
      storedEnv = res;
    } else {
      storage.save('environment', storedEnv, true);
    }
    return storedEnv;
  })
    .catch(() => null);
};

export const switchEnvironments = async () => {
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
          const newEnv = storedEnv === 'production' ? 'staging' : 'production';
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

export const environmentVars = () => {
  return { ...envVars[storedEnv] };
};

export const getEnv = (name: string) => {
  return envVars[storedEnv][name];
};
