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
import { View, StyleSheet } from 'react-native';

// Components
import Text from 'components/core/Text';
import Progress from 'components/Progress';

// Utils
import { useThemeColors } from 'utils/themes';

type Props = {
  forgroundColor: string;
  backgroundColor: string;
  progress: number;
};

export default function ({ forgroundColor, backgroundColor, progress }: Props) {
  const colors = useThemeColors();

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text color={colors.text}>{progress}%</Text>
      <View style={{ flex: 1, marginHorizontal: 5 }}>
        <Progress
          fullStatusValue={100}
          currentStatusValue={progress}
          height={10}
          colorStart={forgroundColor ?? colors.primaryAccent250}
          colorEnd={forgroundColor ?? colors.primaryAccent250}
          emptyBarBackgroundColor={backgroundColor ?? colors.synthetic180}
          barPadding={0}
        />
      </View>
      <Text color={colors.text}>{100 - progress}%</Text>
    </View>
  );
}
