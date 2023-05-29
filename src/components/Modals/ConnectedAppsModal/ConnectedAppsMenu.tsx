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

import React, { FC, ReactElement } from 'react';
import { FlatList, StyleSheet, TouchableOpacity, View, StyleProp, ViewStyle } from 'react-native';
import { useTranslationWithPrefix } from 'translations/translate';

// Components
import Text from 'components/core/Text';

// Utils
import { useThemeColors } from 'utils/themes';

// Local
import DropDown from './DropDown';

interface Props {
  topToPosition: number;
  dropDownStyle?: StyleProp<ViewStyle>;
  visible: boolean;
  onHide: (val: boolean) => void;
  onSelect: (val: Object) => void;
  isV2WC: boolean;
}

export type itemProps = { label: string; value: string; color?: string };

const ConnectedAppsMenu: FC<Props> = ({ isV2WC, dropDownStyle, visible, onHide, onSelect }) => {
  const colors = useThemeColors();
  const { t } = useTranslationWithPrefix('walletConnect.connectedApps');

  const List: itemProps[] = isV2WC
    ? [{ value: 'Disconnect', label: t('disconnect'), color: colors.secondaryAccent240 }]
    : [
        { value: 'Switch wallet', label: t('switchWallet') },
        { value: 'Switch network', label: t('switchNetwork') },
        { value: 'Disconnect', label: t('disconnect'), color: colors.secondaryAccent240 },
      ];

  const renderItem = ({ item }): ReactElement<any, any> => (
    <TouchableOpacity
      style={{ paddingVertical: 10 }}
      onPress={() => {
        onHide(false);
        onSelect(item);
      }}
    >
      <Text variant="regular" color={item.color}>
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <DropDown
      visible={visible}
      onHide={onHide}
      dropDownStyle={dropDownStyle}
      modalContent={
        <FlatList
          data={List}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={[styles.line, { backgroundColor: colors.basic050 }]} />}
          keyExtractor={(item) => item.value}
        />
      }
    />
  );
};

const styles = StyleSheet.create({
  line: {
    width: '100%',
    height: 1,
  },
});

export default ConnectedAppsMenu;
