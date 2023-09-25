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
// This file should not be committed if the existing values are changed to a constant
// the following vars are CI/BUILD related and are fixed for both environment contexts
import { DEVELOPMENT, PRODUCTION } from 'constants/envConstants';

const buildType = __DEV__ ? DEVELOPMENT : PRODUCTION;

export const buildEnvironment = {
  APPSFLYER_DEVKEY: '_appsflyer_devkey_',
  IOS_APP_ID: '1346582238',
  SENTRY_DSN: 'https://3ea39df26dd24e479c27642d11566e43@sentry.io/1294444',
  BUILD_NUMBER: '_build_number_',
  BUILD_TYPE: buildType,
  WERT_ID: '_wert_id_',
  OPEN_SEA_API_KEY: '_open_sea_api_key_',
  INFURA_PROJECT_ID: '_infura_project_id_',
  ONRAMPER_API_KEY: '_onramper_api_key_',
  PRISMIC_TOKEN: '_prismic_token_',
  KOCHAVA_IOS_ID: '_kochava_ios_id_',
  KOCHAVA_ANDROID_ID: '_kochava_android_id_',
  WALLETCONNECT_PROJECT_ID: '_wallet_connect_id_',
  // eslint-disable-next-line i18next/no-literal-string
  WEB3_AUTH_CLIENT_ID: '_web3_auth_client_id_',
  // eslint-disable-next-line i18next/no-literal-string
  WEB3_AUTH_TESTNET_CLIENT_ID: '_web3_auth_testnet_client_id_',
};

// Optional Developer variables are fixed for both environment contexts, undefined by default
export const devOptions = {
  SHOW_THEME_TOGGLE: undefined,
  SHOW_ONLY_STORYBOOK: undefined,
  SHOW_THEME_TOGGLE_IN_STORYBOOK: undefined,
  SHOW_LANG_TOGGLE: undefined,
  DEFAULT_PIN: undefined,
  DISABLE_EXTERNAL_TRANSLATIONS_ON_DEV: undefined,
};
