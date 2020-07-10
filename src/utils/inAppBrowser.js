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

import InAppBrowser from 'react-native-inappbrowser-reborn';
import { reportOrWarn } from 'utils/common';

import type { InAppBrowserOptions } from 'react-native-inappbrowser-reborn';

// NOTE: On Android devices, for react-native-inappbrowser-reborn to work there
// needs to be an application that supports Custom Tabs. Otherwise,
// InAppBrowser.isAvailable method should return false. However, sometimes in
// that case it can return wrong value, which results in the app crashing after
// calling inAppBrowser.open.
//
// For testing, uninstall or disable Chrome and any other browsers.
//
// see: https://github.com/proyecto26/react-native-inappbrowser/pull/108

export const openInAppBrowser = async (url: string, options?: InAppBrowserOptions) => {
  try {
    if (await InAppBrowser.isAvailable()) {
      await InAppBrowser.open(url, options);
    } else {
      reportOrWarn('InAppBrowser.isAvailable() returned false', null, 'warning');
    }
  } catch (error) {
    reportOrWarn('InAppBrowser.error', error, 'warning');
  }
};
