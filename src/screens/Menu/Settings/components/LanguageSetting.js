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
import { useNavigation } from 'react-navigation-hooks';
import { useTranslationWithPrefix } from 'translations/translate';

// Config
import localeConfig from 'configs/localeConfig';

// Constants
import { MENU_SELECT_LANGUAGE } from 'constants/navigationConstants';

// Selectors
import { useLanguageCode } from 'selectors/appSettings';

// Services
import { getLanguageFullName } from 'services/localisation/translations';

// Local
import SettingsItem from './SettingsItem';

function LanguageSetting() {
  const { t } = useTranslationWithPrefix('menu.settings');
  const navigation = useNavigation();

  const showLanguageSetting = useShowLanguageSetting();
  const languageName = useLanguageName();

  if (!showLanguageSetting) return null;

  const goToSelectLanguage = () => navigation.navigate(MENU_SELECT_LANGUAGE);

  return <SettingsItem icon="language16" title={t('language')} value={languageName} onPress={goToSelectLanguage} />;
}

export default LanguageSetting;

function useShowLanguageSetting() {
  return localeConfig.isEnabled || Object.keys(localeConfig.supportedLanguages).length > 1;
}

function useLanguageName() {
  const languageCode = useLanguageCode();
  return getLanguageFullName(languageCode);
}
