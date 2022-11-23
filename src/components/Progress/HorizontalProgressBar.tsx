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
import { StyleSheet, View } from 'react-native';

// Components
import Text from 'components/core/Text';

// Utils
import { useThemeColors } from 'utils/themes';

type Props = {
  forgroundColor: string;
  backgroundColor: string;
  progress: any;
  selectedIndex: number;
};

export default function ({ forgroundColor, backgroundColor, progress, selectedIndex }: Props) {
  const colors = useThemeColors();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text color={colors.text}>{progress}%</Text>
      <View style={{ flex: 1, marginHorizontal: 5, flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={[
            {
              width: progress + '%',
              backgroundColor: forgroundColor,
            },
            styles.shadow,
            styles.leftBorder,
            selectedIndex === 0 && { shadowColor: colors.primaryAccent200 },
          ]}
        />
        <View
          style={[
            {
              width: 100 - progress + '%',
              backgroundColor,
            },
            styles.shadow,
            styles.rightBorder,
            selectedIndex === 1 && { shadowColor: colors.primaryAccent100 },
          ]}
        />
      </View>
      <Text color={colors.text}>{100 - progress}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  shadow: {
    height: 10,
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 3.35,
    elevation: 3,
  },
  leftBorder: {
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
  rightBorder: {
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
});
