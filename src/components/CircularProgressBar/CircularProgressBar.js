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

import React, { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import Svg, { Defs, LinearGradient, Stop, Path, Circle } from 'react-native-svg';
import { withTheme } from 'styled-components/native';
import { getThemeColors, getThemeType } from 'utils/themes';
import { DARK_THEME } from 'constants/appSettingsConstants';
import type { Theme } from 'models/Theme';

type Props = {
  size: number,
  circleWidth: number,
  gradientStart: string,
  gradientEnd: string,
  progress: number,
  style?: Object,
  backgroundAnimationDuration?: number,
  backgroundAnimation?: boolean,
  theme: Theme,
};

const AnimatedPath = Animated.createAnimatedComponent(Path);

const CircularProgressBar = ({
  size,
  circleWidth,
  gradientStart,
  gradientEnd,
  progress,
  style,
  backgroundAnimationDuration,
  backgroundAnimation,
  theme,
}: Props) => {
  const circleAnim = useRef(new Animated.Value(0)).current;
  const backgroundCircleAnim = useRef(new Animated.Value(backgroundAnimation ? 0 : 1)).current;
  const backgroundCircleOpacityAnim = useRef(new Animated.Value(backgroundAnimation ? 0 : 1)).current;

  useEffect(() => {
    Animated.timing(circleAnim, { toValue: progress, duration: 500, useNativeDriver: true }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress]);

  useEffect(() => {
    if (!backgroundAnimationDuration || !backgroundAnimation) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(backgroundCircleOpacityAnim, {
          toValue: 1, duration: backgroundAnimationDuration * 0.4, useNativeDriver: true,
        }),
        Animated.timing(backgroundCircleAnim, {
          toValue: 1, duration: backgroundAnimationDuration * 0.6, useNativeDriver: true,
        }),
        Animated.timing(backgroundCircleOpacityAnim, {
          toValue: 0, duration: backgroundAnimationDuration * 0.1, useNativeDriver: true,
        }),
        Animated.timing(backgroundCircleAnim, { toValue: 0, duration: 1, useNativeDriver: true }),
      ]),
    ).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const circleRadius = (size - circleWidth) / 2;

  /* eslint-disable i18next/no-literal-string */
  const path = `
    M ${size / 2} ${circleWidth / 2}
    A ${circleRadius} ${circleRadius} 0 1 1 ${(size / 2) - 0.0001} ${circleWidth / 2}
  `;
  /* eslint-enable i18next/no-literal-string */

  const circumference = 2 * Math.PI * circleRadius;

  const dashOffset = circleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ([circumference, 0]: number[]),
  });

  const backgroundCircleDashOffset = backgroundCircleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ([circumference, 0]: number[]),
  });

  const colors = getThemeColors(theme);

  return (
    <Svg height={size} width={size} style={style}>
      <Defs>
        <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={gradientStart} stopOpacity="1" />
          <Stop offset="1" stopColor={gradientEnd} stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={size / 2}
        fill={colors.basic050}
      />
      <AnimatedPath
        d={path}
        fill="transparent"
        stroke={getThemeType(theme) === DARK_THEME ? colors.basic080 : '#F7F9FB'}
        strokeWidth={circleWidth}
        strokeLinecap="round"
        strokeDasharray={[circumference, circumference]}
        strokeDashoffset={backgroundCircleDashOffset}
        style={{ opacity: backgroundCircleOpacityAnim }}
      />
      <AnimatedPath
        d={path}
        fill="transparent"
        stroke="url(#grad)"
        strokeWidth={circleWidth}
        strokeLinecap="round"
        strokeDasharray={[circumference, circumference]}
        strokeDashoffset={dashOffset}
      />
    </Svg>
  );
};

export default withTheme(CircularProgressBar);
