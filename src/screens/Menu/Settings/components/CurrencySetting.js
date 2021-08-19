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

// Constants
import { MENU_SELECT_CURRENCY } from 'constants/navigationConstants';

// Selectors
import { useFiatCurrency } from 'selectors';

// Local
import SettingsItem from './SettingsItem';

function CurrencySetting() {
  const { t } = useTranslationWithPrefix('menu.settings');
  const navigation = useNavigation();

  const currency = useFiatCurrency();

  const goToSelectCurrency = () => navigation.navigate(MENU_SELECT_CURRENCY);

  return <SettingsItem icon="currency16" title={t('fiatCurrency')} value={currency} onPress={goToSelectCurrency} />;
}

export default CurrencySetting;
