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

import React, { useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FlatList } from 'react-native';
import t from 'translations/translate';

import SlideModal from 'components/Modals/SlideModal';
import SettingsListItem from 'components/ListItem/SettingsItem';

import { supportedFiatCurrencies, defaultFiatCurrency } from 'constants/assetsConstants';
import { baseFiatCurrencySelector } from 'selectors/selectors';
import { saveBaseFiatCurrencyAction } from 'actions/appSettingsActions';

import type { Dispatch } from 'reducers/rootReducer';

const currencies = supportedFiatCurrencies.map(currency => ({ name: currency, value: currency }));

const BaseFiatCurrencyModal = () => {
  const dispatch = useDispatch<Dispatch>();
  const baseFiatCurrency = useSelector(baseFiatCurrencySelector);
  const initial = baseFiatCurrency || defaultFiatCurrency;
  const modalRef = useRef();

  const renderCurrencyListItem = ({ item: { name, value } }) => (
    <SettingsListItem
      key={value}
      label={name}
      isSelected={value === initial}
      onPress={() => {
        if (modalRef.current) modalRef.current.close();
        dispatch(saveBaseFiatCurrencyAction(value));
      }}
    />
  );

  return (
    <SlideModal
      ref={modalRef}
      fullScreen
      showHeader
      title={t('settingsContent.settingsItem.fiatCurrency.screenTitle')}
      insetTop
    >
      <FlatList
        data={currencies}
        renderItem={renderCurrencyListItem}
        keyExtractor={({ name }) => name}
      />
    </SlideModal>
  );
};

export default BaseFiatCurrencyModal;
