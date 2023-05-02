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
import { Dimensions, View, StyleSheet } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

// Utils
import { useThemeColors } from 'utils/themes';

// Components
import Text from 'components/core/Text';

export const { width: SIZE } = Dimensions.get('window');

const ptData: any = [
  { value: 160, date: '6 Apr 2022' },
  { value: 180, date: '6 Apr 2022' },
  { value: 190, date: '6 Apr 2022' },
  { value: 180, date: '6 Apr 2022' },
  { value: 140, date: '6 Apr 2022' },
  { value: 145, date: '6 Apr 2022' },
  { value: 160, date: '7 Apr 2022' },
  { value: 200, date: '8 Apr 2022' },

  { value: 220, date: '9 Apr 2022' },
  {
    value: 240,
    date: '10 Apr 2022',
  },
  { value: 280, date: '11 Apr 2022' },
  { value: 260, date: '12 Apr 2022' },
  { value: 340, date: '13 Apr 2022' },
  { value: 385, date: '14 Apr 2022' },
  { value: 280, date: '15 Apr 2022' },
  { value: 390, date: '16 Apr 2022' },
  { value: 160, date: '17 Apr 2022' },
  { value: 180, date: '17 Apr 2022' },
  { value: 190, date: '18 Apr 2022' },
  { value: 180, date: '19 Apr 2022' },
  { value: 140, date: '20 Apr 2022' },
  { value: 145, date: '20 Apr 2022' },
  { value: 160, date: '21 Apr 2022' },
  { value: 200, date: '22 Apr 2022' },
];

const AnimatedGraph = () => {
  const colors = useThemeColors();

  return (
    <View style={{ width: '100%' }}>
      <LineChart
        areaChart
        isAnimated
        curved
        hideAxesAndRules
        hideDataPoints
        yAxisSide={'right'}
        animationDuration={1700}
        data={ptData}
        width={SIZE}
        spacing={SIZE / ptData?.length + 1}
        color={colors.caribbeanGreen}
        thickness={2.1}
        startFillColor={colors.caribbeanGreen}
        endFillColor={colors.caribbeanGreen}
        startOpacity={0.2}
        endOpacity={0.01}
        stepHeight={0}
        disableScroll
        height={155}
        maxValue={500}
        initialSpacing={0}
        pointerConfig={{
          pointerStripHeight: 150,
          pointerStripColor: colors.secondaryText,
          pointerStripWidth: 1,
          pointerColor: colors.caribbeanGreen,
          radius: 6,
          pointerLabelHeight: 50,
          pointerLabelWidth: 100,
          strokeDashArray: [3, 3],
          stripOverPointer: true,
          activatePointersOnLongPress: true,
          autoAdjustPointerLabelPosition: false,
          pointerLabelComponent: (items) => {
            return (
              <Text variant="tiny" style={styles.textStyle}>
                {items[0].date}
              </Text>
            );
          },
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  textStyle: {
    position: 'absolute',
    left: -15,
    top: 200,
  },
});

export default AnimatedGraph;
