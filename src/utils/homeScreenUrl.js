// @flow
/*
    Pillar Wallet: the personal data locker
    Copyright (C) 2021 Stiftung Pillar Project

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
// eslint-disable-next-line import/no-extraneous-dependencies
import AsyncStorage from '@react-native-async-storage/async-storage';

const HOME_SCREEN_URL_KEY = 'homeScreenUrlOverride';

export const PRESET_URLS = {
  PRODUCTION: 'https://pillarx.app',
  STAGING: 'https://staging.pillarx.app',
  DEFAULT: null, // null means use Firebase Remote Config
  CUSTOM: 'CUSTOM', // Special value to indicate custom URL is set
};

/**
 * Get the custom home screen URL override from storage
 * @returns {Promise<?string>} The custom URL or null if not set
 */
export const getHomeScreenUrlOverride = async (): Promise<?string> => {
  try {
    const url = await AsyncStorage.getItem(HOME_SCREEN_URL_KEY);
    return url || null;
  } catch (error) {
    return null;
  }
};

/**
 * Set the custom home screen URL override in storage
 * @param {?string} url - The URL to set, or null to clear the override
 * @returns {Promise<void>}
 */
export const setHomeScreenUrlOverride = async (url: ?string): Promise<void> => {
  try {
    if (url === null || url === '') {
      await AsyncStorage.removeItem(HOME_SCREEN_URL_KEY);
    } else {
      await AsyncStorage.setItem(HOME_SCREEN_URL_KEY, url);
    }
  } catch (error) {
    // Silently fail
  }
};

