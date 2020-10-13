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
import { FlatList } from 'react-native';

import SlideModal from 'components/Modals/SlideModal';
import SettingsListItem from 'components/ListItem/SettingsItem';

type Props = {|
  title: string,
  options: { value: string, name: string }[],
  initial: string,
  onSelect: (value: string) => void,
|};

const OptionListModal = ({
  title,
  options,
  initial,
  onSelect,
}: Props) => {
  const modalRef = useRef();

  const renderListItem = ({ item: { name, value } }) => (
    <SettingsListItem
      key={value}
      label={name}
      isSelected={value === initial}
      onPress={() => {
        if (modalRef.current) modalRef.current.close();
        onSelect(value);
      }}
    />
  );

  return (
    <SlideModal
      ref={modalRef}
      fullScreen
      showHeader
      title={title}
      insetTop
    >
      <FlatList
        data={options}
        renderItem={renderListItem}
        keyExtractor={({ value }) => value}
      />
    </SlideModal>
  );
};

export default OptionListModal;
