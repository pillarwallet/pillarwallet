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

// Constants
import { TOKENS, STABLES } from 'constants/walletConstants';

type Props = {
  forgroundColor: string;
  backgroundColor: string;
  progress: any;
  selectedName: string;
  style?: any;
  hidePercentage?: boolean;
};

export default function ({ forgroundColor, backgroundColor, progress, selectedName, style, hidePercentage }: Props) {
  const colors = useThemeColors();

  const stableTokensProgress = 100 - progress;
  const decimalNm = progress > 99 || progress < 1 ? 2 : 0;

  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>
      {!hidePercentage && <Text color={colors.text}>{progress.toFixed(decimalNm)}%</Text>}
      <View style={{ flex: 1, marginHorizontal: 5, flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={[
            {
              width: progress + '%',
              backgroundColor: forgroundColor,
            },
            styles.shadow,
            styles.leftBorder,
            progress > 99.5 && styles.rightBorder,
            selectedName === TOKENS && { shadowColor: colors.darkViolet },
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
            progress < 0.5 && styles.leftBorder,
            selectedName === STABLES && { shadowColor: colors.dodgerBlue },
          ]}
        />
      </View>
      {!hidePercentage && <Text color={colors.text}>{stableTokensProgress.toFixed(decimalNm)}%</Text>}
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
    shadowColor: 'transparent',
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
