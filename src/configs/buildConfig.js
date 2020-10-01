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
  SENTRY_DSN: 'https://3ea39df26dd24e479c27642d11566e43@sentry.io/1294444',
  BUILD_NUMBER: '_build_number_',
  BUILD_TYPE: buildType,
  OPEN_SEA_API_KEY: '_open_sea_api_key_',
  INFURA_PROJECT_ID: '_infura_project_id_',
  ETHPLORER_API_KEY: '_ethplorer_api_key_',
  RAMPNETWORK_API_KEY: '_rampnetwork_api_key_',
};

// Optional Developer variables are fixed for both environment contexts, undefined by default
export const devOptions = {
  SHOW_THEME_TOGGLE: undefined,
  SHOW_ONLY_STORYBOOK: undefined,
  SHOW_LANG_TOGGLE: undefined,
  DEFAULT_PIN: undefined,
};
