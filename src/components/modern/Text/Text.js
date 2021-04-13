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
import { Text as RNText, StyleSheet } from 'react-native';

// Utils
import { useThemeColors } from 'utils/themes';
import { appFont, objectFontStyles } from 'utils/variables';

// Types
import type { TextProps, TextStyleProp, FontVariant } from 'utils/types/react-native';
import type { ThemeColors } from 'models/Theme';


type Props = {|
  ...TextProps,
  variant?: $Keys<typeof objectFontStyles>,
  color?: $Keys<ThemeColors>,
|};

function Text({
  variant,
  color,
  style,
  ...rest
}: Props) {
  const colors = useThemeColors();
  const propStyle = StyleSheet.flatten(style);

  const resultStyle = [
    baseStyle,
    { color: colors[color ?? 'basic010'] },
    // Apply `regular` font style only if there is no `font-size` style in order to
    // avoid automatically setting regular 'line-height'.
    !propStyle?.fontSize && objectFontStyles.regular,
    !!variant && objectFontStyles[variant],
    style,
  ];

  return <RNText {...rest} style={resultStyle} />;
}

const baseStyle: TextStyleProp = {
  textAlignVertical: 'center',
  fontFamily: appFont.regular,
};

export default Text;
