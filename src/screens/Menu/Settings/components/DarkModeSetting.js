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

import * as React from 'react';
import { useDispatch } from 'react-redux';
import { useTranslationWithPrefix } from 'translations/translate';

// Constants
import { DARK_THEME, LIGHT_THEME } from 'constants/appSettingsConstants';

// Selectors
import { useRootSelector } from 'selectors';

// Actions
import { setAppThemeAction } from 'actions/appSettingsActions';

// Local
import SettingsToggle from './SettingsToggle';

function DarkModeSetting() {
  const { t } = useTranslationWithPrefix('menu.settings');
  const dispatch = useDispatch();

  const isDarkMode = useRootSelector((root) => root.appSettings.data.themeType) === DARK_THEME;

  const handleChangeValue = (value: boolean) => dispatch(setAppThemeAction(value ? DARK_THEME : LIGHT_THEME, true));

  return (
    <SettingsToggle icon="darkMode16" title={t('darkMode')} value={isDarkMode} onChangeValue={handleChangeValue} />
  );
}

export default DarkModeSetting;
