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

import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import t from 'translations/translate';

import OptionListModal from 'components/OptionListModal';
import localeConfig from 'configs/localeConfig';
import { getDefaultSupportedUserLanguage } from 'services/localisation/translations';
import { changeLanguageAction } from 'actions/localisationActions';

import type { RootReducerState } from 'reducers/rootReducer';
import type { AbstractComponent } from 'react';

const languages = Object.keys(localeConfig.supportedLanguages)
  .map(languageCode => ({ name: localeConfig.supportedLanguages[languageCode], value: languageCode }));

const currentLanguageSelector = ({ appSettings: { data: { localisation } } }: RootReducerState) =>
  localisation?.activeLngCode || getDefaultSupportedUserLanguage();

const LanguageModal: AbstractComponent<{||}> = () => {
  const currentLanguage = useSelector(currentLanguageSelector);
  const dispatch = useDispatch();

  return (
    <OptionListModal
      title={t('settingsContent.settingsItem.language.screenTitle')}
      options={languages}
      initial={currentLanguage}
      onSelect={value => dispatch(changeLanguageAction(value))}
    />
  );
};

export default LanguageModal;
