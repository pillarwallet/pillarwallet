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
import { StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';

// Components
import Text from 'components/core/Text';

// Utils
import { useThemeColors } from 'utils/themes';
import { spacing } from 'utils/variables';

type Props = {
  items: any[];
  tabName: string;
  onSelectedTabName: (name: string) => void;
};

export default function ({ items, tabName, onSelectedTabName }: Props) {
  const colors = useThemeColors();

  const renderItem = (item, index) => {
    const width = (Dimensions.get('screen').width - spacing.large * 2) / items?.length;
    const isSelected = item.title === tabName;

    return (
      <TouchableOpacity
        key={'tabs__' + index}
        style={[{ width }, styles.btn, isSelected && { backgroundColor: item.color }]}
        onPress={() => onSelectedTabName(item.title)}
      >
        <Text color={isSelected ? colors.control : colors.text}>{item.title}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView style={{}} horizontal bounces={false} scrollEnabled={false}>
      {items?.map(renderItem)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  btn: { alignItems: 'center', justifyContent: 'center', height: 40, borderRadius: 20 },
});
