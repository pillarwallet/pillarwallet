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
import { Platform } from 'react-native';
import t from 'translations/translate';
import DeviceInfo from 'react-native-device-info';
import { openComposer } from 'react-native-email-link';

// Components
import Toast from 'components/Toast';

// Constants
import { REMOTE_CONFIG } from 'constants/remoteConfigConstants';

// Utils
import { reportErrorLog } from 'utils/common';

// Services
import { firebaseRemoteConfig } from 'services/firebase';

// Configs
import { getEnv } from 'configs/envConfig';
import { isEmpty } from 'lodash';

// Types
import type { Account } from 'models/Account';

export const emailSupport = async (accounts?: Account[]) => {
  const buildNumber = getEnv().BUILD_NUMBER;
  const osVersion = await DeviceInfo.getSystemVersion();
  const deviceName = await DeviceInfo.getDeviceName();

  const email = firebaseRemoteConfig.getString(REMOTE_CONFIG.APP_SUPPORT_EMAIL);

  const subject = `Pillar Support - ${Platform.OS} ${osVersion} (${buildNumber})`;

  let accountsWithId;
  if (!isEmpty(accounts)) {
    accountsWithId = accounts.map((account) => `${account.type.toLowerCase()}: ${account.id}`);
  }

  const body =
    `OS Version: ${osVersion}
    \n\nBuild number: ${buildNumber}
    \n\nDevice Name: ${deviceName}` + (accountsWithId ? `\n\nAccounts:\n${accountsWithId.join('\n')}` : ``);

  return openComposer({
    to: email,
    subject,
    body,
  }).catch((error) => {
    reportErrorLog('Failed email support', { deviceName, osVersion, error });
    Toast.show({
      message: error?.message ?? t('error.invalidEmailURL'),
      emoji: 'hushed',
    });
    return null;
  });
};
